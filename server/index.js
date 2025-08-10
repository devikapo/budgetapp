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

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
