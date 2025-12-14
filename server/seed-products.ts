import { getUncachableStripeClient } from './stripeClient';

async function createProducts() {
  const stripe = await getUncachableStripeClient();

  // Check if ScopeGen Pro exists
  const existingPro = await stripe.products.search({ query: "name:'ScopeGen Pro'" });
  if (existingPro.data.length > 0) {
    console.log('ScopeGen Pro already exists:', existingPro.data[0].id);
  } else {
    const proProduct = await stripe.products.create({
      name: 'ScopeGen Pro',
      description: 'Unlimited proposals with full scope details, no blurred content, and premium features.',
      metadata: {
        app: 'scopegen',
        tier: 'pro',
      },
    });
    console.log('Created ScopeGen Pro:', proProduct.id);

    const monthlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 2900,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { plan: 'monthly' },
    });
    console.log('Created monthly price:', monthlyPrice.id, '- $29/month');

    const yearlyPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 24900,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { plan: 'yearly' },
    });
    console.log('Created yearly price:', yearlyPrice.id, '- $249/year');
  }

  // Check if Single Proposal exists
  const existingSingle = await stripe.products.search({ query: "name:'Single Proposal'" });
  if (existingSingle.data.length > 0) {
    console.log('Single Proposal already exists:', existingSingle.data[0].id);
  } else {
    const singleProduct = await stripe.products.create({
      name: 'Single Proposal',
      description: 'Unlock one full proposal with complete scope of work details.',
      metadata: {
        app: 'scopegen',
        type: 'credit',
        credits: '1',
      },
    });
    console.log('Created Single Proposal:', singleProduct.id);

    const singlePrice = await stripe.prices.create({
      product: singleProduct.id,
      unit_amount: 1200,
      currency: 'usd',
      metadata: { type: 'single' },
    });
    console.log('Created single price:', singlePrice.id, '- $12');
  }

  // Check if 10 Credit Pack exists
  const existingPack = await stripe.products.search({ query: "name:'10 Credit Pack'" });
  if (existingPack.data.length > 0) {
    console.log('10 Credit Pack already exists:', existingPack.data[0].id);
  } else {
    const packProduct = await stripe.products.create({
      name: '10 Credit Pack',
      description: 'Unlock 10 full proposals - best value! Save $81 compared to buying individually.',
      metadata: {
        app: 'scopegen',
        type: 'credit',
        credits: '10',
      },
    });
    console.log('Created 10 Credit Pack:', packProduct.id);

    const packPrice = await stripe.prices.create({
      product: packProduct.id,
      unit_amount: 3900,
      currency: 'usd',
      metadata: { type: 'pack' },
    });
    console.log('Created pack price:', packPrice.id, '- $39');
  }
}

createProducts()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
