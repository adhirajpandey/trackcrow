export const numberToINR = (amount: number): string => {
    const INR = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      });

    return INR.format(amount)
};