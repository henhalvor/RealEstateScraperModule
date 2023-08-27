const axios = require("axios");
const cheerio = require("cheerio");

function m2Pris(object) {
  const m2Data = parseFloat(object["Primærrom"].match(/\d+/)[0]);
  const totalPrisData = parseFloat(
    object["Totalpris"].replace(/\s/g, "").replace("kr", "")
  );
  const m2Pris = Math.round(totalPrisData / m2Data);
  const formattedM2Pris = m2Pris.toLocaleString("nb-NO") + " kr";

  object["M2-Pris"] = formattedM2Pris;
}

function addLink(object, url) {
  object["Link"] = url;
}

function extractAddress($, object) {
  const adress = $('span[data-testid="object-address"]').first().text().trim();
  object["Adresse"] = adress;
}

function extractEnergyLabel($, object) {
  const energyLabel = $(
    'div[data-testid="energy-label"] span[data-testid="energy-label-info"]'
  )
    .text()
    .trim();
  object["Energimerking"] = energyLabel;
}

async function scrapeRealEstateData(url) {
  try {
    const response = await axios.get(url);
    const html = response.data;

    const $ = cheerio.load(html);

    const pricing_target_values = [
      "pricing-incicative-price",
      "pricing-total-price",
      "pricing-registration-charge",
      "pricing-joint-debt",
      "pricing-common-monthly-cost",
      "pricing-collective-assets",
      "pricing-municipal-fees",
      "pricing-tax-value",
    ];

    const info_target_values = [
      "info-property-type",
      "info-ownership-type",
      "info-primary-area",
      "info-usable-area",
      "info-floor",
      "info-construction-year",
      "info-plot-area",
    ];

    const dataTestIds = pricing_target_values.concat(info_target_values);

    const extractedData = {};

    dataTestIds.forEach((dataTestId) => {
      const divElement = $(`div[data-testid="${dataTestId}"]`);

      if (divElement.length > 0) {
        const firstChildText = divElement.find(":first-child").text().trim();
        const lastChildText = divElement.find(":last-child").text().trim();

        extractedData[firstChildText] = lastChildText;
      }
    });

    // Call functions to add the rest of the data
    extractAddress($, extractedData);
    extractEnergyLabel($, extractedData);
    m2Pris(extractedData);
    addLink(extractedData, url);

    return extractedData;
  } catch (error) {
    console.error("An error occurred:", error);
    throw error;
  }
}

async function runRealEstateScraper(url) {
  try {
    const results = await scrapeRealEstateData(url);
    console.log(results);
    return results;
  } catch (error) {
    console.error("An error occurred:", error);
  }
}

module.exports = {
  runRealEstateScraper,
};

// Example usage

// const { runRealEstateScraper } = require('./realEstateScraper');

// const targetUrl = 'https://www.finn.no/realestate/homes/ad.html?finnkode=312160150';
// console.log(runRealEstateScraper(targetUrl));
