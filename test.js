const firstArray = [];
const secondArray = [];

for (let i = 0; i < 6000; i++) {
  if (i < 10) {
    firstArray.push(i);
  } else {
    secondArray.push(i);
  }
}

const firstMap = firstArray.map((item) => ({
  id: item,
  name: `this is name ${item}`,
}));

console.log(firstMap);
