var jsonQuery = require("json-query");
const p = require("phin");
// const js = require("./1.json");

async function aaa() {
  const data1 = await p({
    url: "https://api.tinkoff.ru/geo/withdraw/clusters",
    method: "POST",
    data: {
      bounds: {
        bottomLeft: { lat: 55.33975456658658, lng: 35.88266488110352 },
        topRight: { lat: 56.52984135518109, lng: 42.10641976391602 },
      },
      filters: { showUnavailable: false, currencies: ["USD"] },
      zoom: 8,
    },
  });

  // data.body

  const data = JSON.parse(data1.body.toString());

  const points = jsonQuery("payload.clusters.points", {
    data,
  });

  let res = points.value.filter(
    (p) => p.limits.find((l) => l.currency == "USD") && p.brand.id === "tcs"
  );

  res = res.map((p) => ({
    location: p.location,
    address: p.address,
    max: p.limits.find((l) => l.currency == "USD").max,
    amount: p.limits.find((l) => l.currency == "USD").amount,
    // denominations: p.limits.find((l) => l.currency == "USD").denominations,
    atmInfoAvailable: p.atmInfo.available,
    atmInfoIsTerminal: p.atmInfo.isTerminal,
    criticalFailure: p.atmInfo.statuses.criticalFailure,
  }));

  const naturalCollator = new Intl.Collator(undefined, {
    numeric: true,
    sensitivity: "base",
  });

  res.sort((b, a) => naturalCollator.compare(a.amount, b.amount));

  res = res.filter((r) => r.amount > 100);

  // console.log(res);
  // console.log(res.length);

  return res;

  // console.log(res);
}

// aaa();

const http = require("http");

const requestListener = async function (req, res) {
  console.log("request");
  const data = await aaa();

  const body = `
  <head><title>Банкоматы</title>
  <style>
  table {border-collapse: collapse;}
    td, th {
      border: solid 1px;
    }
  </style></head>
<body>
  <h3>С деньгами: ${data.length}</h3>
  <table>
  <tr>
  <th>Остаток</th>
  <th>Адрес</th>
  </tr>
    ${data
      .map(
        (p) =>
          `<tr><td>${p.amount}</td><td><a href="yandexmaps://maps.yandex.ru/?ll=${p.location.lat},${p.location.lng}">${p.address}</a></td></tr>`
      )
      .join("")}
  </table>
</body>
  `;

  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.write(body, "utf-8");
  res.end();
};

const server = http.createServer(requestListener);
server.listen(8080);

console.log("server started");

// import jsonQuery from 'json-query'

// var data = {
//   people: [
//     { name: "Matt", country: "NZ" },
//     { name: "Pete", country: "AU" },
//     { name: "Mikey", country: "NZ" },
//   ],
// };

// const a = jsonQuery("people[country=NZ].name", {
//   data: data,
// });
