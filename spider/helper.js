
async function sleep(ms) {
  const { logger } = this;
  console.log('暂停时间: ', ms);
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  sleep
}
