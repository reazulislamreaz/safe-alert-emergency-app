const firstArray = [];
const secondArray = [];

for (let i = 0; i < 6000; i++) {
  if (i < 3000) {
    firstArray.push(i);
  } else {
    secondArray.push(i);
  }
}
console.log(firstArray.length);
console.log(secondArray.length);
