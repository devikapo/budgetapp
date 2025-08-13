require("dotenv").config();
const express = require("express");
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8000;

const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});
const plaidClient = new PlaidApi(config);

let ITEMS = [];

// Account linking endpoints
app.post("/api/link-token", async (req, res) => {
  try {
    const tokenResponse = await plaidClient.linkTokenCreate({
      user: { client_user_id: "user-123" },
      client_name: "Budget App",
      products: ["transactions"],
      country_codes: ["US"],
      language: "en",
    });
    res.json(tokenResponse.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/exchange-token", async (req, res) => {
  try {
    const { public_token } = req.body;
    const r = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = r.data.access_token;
    const item_id = r.data.item_id;

    const itemInfo = await plaidClient.itemGet({ access_token });
    const institution_id = itemInfo.data.item.institution_id || null;

    let institution_name = null;
    if (institution_id) {
      const inst = await plaidClient.institutionsGetById({
        institution_id,
        country_codes: ["US"],
      });
      institution_name = inst.data.institution.name || null;
    }

    ITEMS.push({ item_id, access_token, institution_id, institution_name });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Plaid OAuth callback endpoint
app.get("/callback", async (req, res) => {
  try {
    console.log("Plaid OAuth callback hit at", new Date().toISOString());
    console.log("Query params received:", req.query);
    // Plaid will redirect with query params: state, oauth_state_id, etc.
    const { state, oauth_state_id, public_token } = req.query;
    // If Plaid provides a public_token, exchange it for an access_token
    if (public_token) {
      console.log("public_token received:", public_token);
      const r = await plaidClient.itemPublicTokenExchange({ public_token });
      const access_token = r.data.access_token;
      const item_id = r.data.item_id;
      console.log("Exchanged access_token:", access_token);
      // Optionally, fetch institution info
      const itemInfo = await plaidClient.itemGet({ access_token });
      const institution_id = itemInfo.data.item.institution_id || null;
      let institution_name = null;
      if (institution_id) {
        const inst = await plaidClient.institutionsGetById({
          institution_id,
          country_codes: ["US"],
        });
        institution_name = inst.data.institution.name || null;
      }
      console.log("Institution:", institution_id, institution_name);
      ITEMS.push({ item_id, access_token, institution_id, institution_name });
      // Redirect to mobile app deep link (if needed)
      return res.redirect("com.devikapo.mobile://success");
    }
    // If no public_token, show a message
    console.log("No public_token found in callback query params.");
    res.send("Plaid OAuth callback received. No public_token found.");
  } catch (e) {
    console.error("Error in Plaid OAuth callback:", e);
    res.status(500).send(`Error in Plaid OAuth callback: ${e.message}`);
  }
});

// Getting accounts' items
app.get("/api/items-with-accounts", async (req, res) => {
  try {
    const result = [];
    for (const it of ITEMS) {
      const acc = await plaidClient.accountsGet({
        access_token: it.access_token,
      });
      result.push({
        item_id: it.item_id,
        institution_id: it.institution_id,
        institution_name: it.institution_name,
        accounts: acc.data.accounts,
      });
    }
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.delete("/api/items/:item_id", async (req, res) => {
  try {
    const idx = ITEMS.findIndex((i) => i.item_id === req.params.item_id);
    if (idx === -1) return res.status(404).json({ error: "Item not found" });
    await plaidClient.itemRemove({ access_token: ITEMS[idx].access_token });
    ITEMS.splice(idx, 1);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Getting transactions
app.get("/api/transactions", async (req, res) => {
  try {
    if (!ITEMS || !ITEMS.length) return res.json([]);

    const today = new Date();
    const end = req.query.end || today.toISOString().slice(0, 10);
    const start =
      req.query.start ||
      new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10);
    const all = [];
    for (const it of ITEMS) {
      const r = await plaidClient.transactionsGet({
        access_token: it.access_token,
        start_date: start,
        end_date: end,
        options: { count: 500, offset: 0 },
      });
      const txns = r.data.transactions.map((t) => ({
        ...t,
        item_id: it.item_id,
      }));
      all.push(...txns);
    }
    all.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    res.json(all);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get balances for all accounts
app.get("/api/balances", async (req, res) => {
  try {
    if (!ITEMS || !ITEMS.length) return res.json([]);
    const all = [];
    for (const it of ITEMS) {
      const acc = await plaidClient.accountsGet({
        access_token: it.access_token,
      });
      all.push(
        ...acc.data.accounts.map((a) => ({
          ...a,
          item_id: it.item_id,
          institution_id: it.institution_id,
          institution_name: it.institution_name,
        }))
      );
    }
    res.json(all);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Get balance history for a specific account (reconstructed from transactions)
app.get("/api/balance-history/:account_id", async (req, res) => {
  try {
    const { account_id } = req.params;
    if (!ITEMS || !ITEMS.length) return res.json([]);
    // Gather all transactions for this account
    let allTxns = [];
    for (const it of ITEMS) {
      const r = await plaidClient.transactionsGet({
        access_token: it.access_token,
        start_date: req.query.start || "2000-01-01",
        end_date: req.query.end || new Date().toISOString().slice(0, 10),
        options: { account_ids: [account_id], count: 500, offset: 0 },
      });
      allTxns.push(...r.data.transactions);
    }
    if (!allTxns.length) return res.json([]);
    // Get current balance from Plaid
    let currentBalance = null;
    for (const it of ITEMS) {
      const acc = await plaidClient.accountsGet({
        access_token: it.access_token,
      });
      const found = acc.data.accounts.find((a) => a.account_id === account_id);
      if (
        found &&
        found.balances &&
        typeof found.balances.current === "number"
      ) {
        currentBalance = found.balances.current;
        break;
      }
    }
    if (currentBalance === null)
      return res
        .status(404)
        .json({ error: "Account not found or no balance info" });
    // Build daily balance history
    allTxns.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0)); // newest first
    const history = [];
    let running = currentBalance;
    let lastDate = allTxns[0]?.date;
    let i = 0;
    while (lastDate && i < allTxns.length) {
      // For each day, subtract all transactions for that day
      const txnsForDay = allTxns.filter((t) => t.date === lastDate);
      const totalForDay = txnsForDay.reduce(
        (sum, t) => sum + Number(t.amount),
        0
      );
      history.push({ date: lastDate, balance: running });
      running -= totalForDay;
      // Move to previous day
      const prev = new Date(lastDate);
      prev.setDate(prev.getDate() - 1);
      lastDate = prev.toISOString().slice(0, 10);
      i += txnsForDay.length;
    }
    // Optionally, fill in days with no transactions
    res.json(history.reverse()); // oldest first
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
