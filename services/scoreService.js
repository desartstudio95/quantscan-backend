const generateScore = (data) => {

  let score = 50;

  // MULTI TIMEFRAME

  if(data.multiTimeframe)
    score += 10;

  // SMART MONEY

  if(data.smc)
    score += 15;

  // MOMENTUM

  if(data.momentum)
    score += 10;

  // LIQUIDITY SWEEP

  if(data.liquidity)
    score += 10;

  // FUNDAMENTAL

  if(data.fundamental)
    score += 10;

  // LONG TERM

  if(data.longTerm)
    score += 5;

  // ALINHAMENTO TREND

  if(data.trendAlignment)
    score += 10;

  if(score > 100)
    score = 100;

  return score;

};

module.exports = generateScore;
