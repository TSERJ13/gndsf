// NBG (National Bank of Georgia) API for exchange rates
// API Docs / Structure: https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/ka/json

export type CurrencyRate = {
  code: string; // e.g. "USD", "EUR"
  rate: number; // e.g. 2.71
  name: string; // e.g. "აშშ დოლარი"
};

export type NbgRates = Record<string, number>;

export async function getExchangeRates(): Promise<NbgRates> {
  try {
    const res = await fetch("https://nbg.gov.ge/gw/api/ct/monetarypolicy/currencies/ka/json", {
      next: { revalidate: 3600 * 4 }, // cache for 4 hours
    });
    
    if (!res.ok) {
      console.error("Failed to fetch NBG rates:", res.statusText);
      return {};
    }

    const data = await res.json();
    
    // NBG returns an array where the first element contains the latest rates
    if (!data || !data[0] || !data[0].currencies) {
      return {};
    }

    const currencies: CurrencyRate[] = data[0].currencies;
    
    const targetCodes = ["USD", "EUR", "GBP", "CHF"];
    const ratesMap: NbgRates = {};

    for (const c of currencies) {
      if (targetCodes.includes(c.code)) {
        // Handle cases where 'quantity' is not 1 (though for these major ones it is usually 1)
        // If NBG says 10 HKD = 3.35 GEL, then rate for 1 HKD is rate / quantity
        const quantity = (c as any).quantity || 1;
        ratesMap[c.code] = c.rate / quantity;
      }
    }

    return ratesMap;
  } catch (error) {
    console.error("Error fetching NBG rates:", error);
    return {};
  }
}
