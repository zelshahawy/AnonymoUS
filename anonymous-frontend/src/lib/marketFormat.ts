const numberFormatter = new Intl.NumberFormat('en-US', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
});
const priceFormatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export const formatMarketNumber = (value: number) => numberFormatter.format(value);
export const formatMarketPrice = (value: number) => priceFormatter.format(value);
