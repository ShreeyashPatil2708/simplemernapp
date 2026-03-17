const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const quoteRequests = [];
const AGE_THRESHOLD = 30;
const AGE_SURCHARGE_PER_YEAR_OVER_THRESHOLD = 0.8;

app.use(express.urlencoded({ extended: false }));
app.use('/public', express.static('public'));

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderPage(title, content) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/public/styles.css" />
</head>
<body>
  <header>
    <h1>SafeNest Insurance</h1>
    <nav>
      <a href="/">Home</a>
      <a href="/requests">Quote Requests</a>
    </nav>
  </header>
  <main>${content}</main>
</body>
</html>`;
}

app.get('/', (_req, res) => {
  res.send(
    renderPage(
      'SafeNest Insurance',
      `<section class="card">
        <h2>Simple Insurance Plans</h2>
        <ul>
          <li>Health Basic - starts at $40/month</li>
          <li>Vehicle Shield - starts at $30/month</li>
          <li>Home Secure - starts at $35/month</li>
        </ul>
      </section>
      <section class="card">
        <h2>Get a Quick Quote</h2>
        <form method="post" action="/quote">
          <label for="name">Full Name</label>
          <input id="name" name="name" required />

          <label for="plan">Insurance Type</label>
          <select id="plan" name="plan" required>
            <option value="Health Basic">Health Basic</option>
            <option value="Vehicle Shield">Vehicle Shield</option>
            <option value="Home Secure">Home Secure</option>
          </select>

          <label for="age">Age</label>
          <input id="age" name="age" type="number" min="18" max="100" required />

          <button type="submit">Get Quote</button>
        </form>
      </section>`
    )
  );
});

app.post('/quote', (req, res) => {
  const { name, plan, age } = req.body;
  const numericAge = Number(age);

  if (!name || !plan || Number.isNaN(numericAge) || numericAge < 18 || numericAge > 100) {
    return res.status(400).send(
      renderPage('Invalid Request', `<section class="card"><h2>Invalid input</h2><p>Please go back and enter valid details.</p></section>`)
    );
  }

  const basePriceByPlan = {
    'Health Basic': 40,
    'Vehicle Shield': 30,
    'Home Secure': 35,
  };

  const basePrice = basePriceByPlan[plan] || 30;
  const ageAdjustment = Math.max(0, numericAge - AGE_THRESHOLD) * AGE_SURCHARGE_PER_YEAR_OVER_THRESHOLD;
  const estimatedPremium = (basePrice + ageAdjustment).toFixed(2);

  quoteRequests.push({
    name,
    plan,
    age: numericAge,
    estimatedPremium,
    createdAt: new Date(),
  });

  return res.send(
    renderPage(
      'Quote Result',
      `<section class="card">
        <h2>Quote Ready</h2>
        <p>Thank you, <strong>${escapeHtml(name)}</strong>.</p>
        <p>Your estimated premium for <strong>${escapeHtml(plan)}</strong> is <strong>$${escapeHtml(estimatedPremium)}/month</strong>.</p>
        <a class="button-link" href="/">Request another quote</a>
      </section>`
    )
  );
});

app.get('/requests', (_req, res) => {
  const listHtml =
    quoteRequests.length === 0
      ? '<p>No quote requests submitted yet.</p>'
      : `<table>
          <thead>
            <tr><th>Name</th><th>Plan</th><th>Age</th><th>Estimated Premium</th><th>Submitted</th></tr>
          </thead>
          <tbody>
            ${quoteRequests
              .map(
                (request) => `<tr>
                <td>${escapeHtml(request.name)}</td>
                <td>${escapeHtml(request.plan)}</td>
                <td>${escapeHtml(request.age)}</td>
                <td>$${escapeHtml(request.estimatedPremium)}</td>
                <td>${escapeHtml(request.createdAt.toLocaleString())}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>`;

  res.send(renderPage('Quote Requests', `<section class="card"><h2>Submitted Quote Requests</h2>${listHtml}</section>`));
});

app.listen(port, () => {
  console.log(`SafeNest Insurance running on http://localhost:${port}`);
});
