// const firstArray = [];
// const secondArray = [];

// for (let i = 0; i < 6000; i++) {
//   if (i < 1000) {
//     firstArray.push(i);
//   } else {
//     secondArray.push(i);
//   }
// }

// const firstMap = firstArray.map((item) => ({
//   id: item,
//   name: `this is name ${item}`,
// }));

// // console.time("find");
// // const find = firstMap.find((item) => item.id === 10);
// // console.log(find);
// // console.timeEnd("find");

// console.timeEnd("directFind");
// // console.log(firstMap);


const set = new Set(["Reaz","Tasin","Fahim","Reaz","Tasin","Fahim"]);

set.add("Nasim");
console.log(set.delete("Fahim"));
console.log(set);