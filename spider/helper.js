async function sleep(ms) {
  console.log(`暂停时间: ${ms / 1000}s \n`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  sleep,
};
