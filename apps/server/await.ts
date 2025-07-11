const constant = 1;
export default constant;

console.log(1)

await new Promise((resolve) => {
  console.log(2);
  resolve(88)
});

console.log(3)
