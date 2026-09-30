// const arr = [1, 2, 3, 4, 5];

// let largest = arr[0];

// for (let i =0 ; i<arr.length; i++){
//     if(arr[i]> largest){
//         largest =arr[i];
//     }
// }
// console.log(largest)
// ?Problem 1 — Find the Smallest Number

/*let arr = [5, 2, 9, 1, 7, 3];

let smallest = arr[0];

for (let i = 0; i <arr.length; i++){
    if (arr[i]<smallest){{    
        smallest = arr[i];
    }
    }}

console.log(smallest)
*/
//? Problem 4 — Count Even Numbers

/*
let arr = [1, 4, 7, 8, 10, 13, 16];
  let count = 0;
  for (let i =0; i <arr.length; i++){ 
    if (arr[i]%2 ===0){
      count ++;
    }
  }
  console.log(count)
*/

//   ? Problem 5 — Find the Sum of All Numbers

/*let arr = [1, 4, 7, 8, 10, 13, 16];

let sum = 0;
for (let i=0; i< arr.length; i++){

    sum = sum + arr[i];

}
console.log(sum)
*/
// ?Problem 7 — Reverse an Array


/*
let arr = ["apple", "banana", "cherry", "date", "elderberry"];

let reversed =[];

for (let i = arr.length -1 ; i >=0 ; i--){
 reversed.push(arr[i]);
}

console.log(reversed)
*/
// Problem 10 — Remove Duplicates

/*
let arr = [1, 2, 2, 3, 4, 4, 5];


let newArr= [];
for (let i= 0 ; i< arr.length ; i++){
    if (!newArr.includes(arr[i])){
        newArr.push(arr[i])
    }
}
 
console.log(newArr)
*/

// ?Problem 6 — Find the Second Largest Number
/*
const arr = [2, 7, 8, 9, 3];

let largest = 0;
let secondLargest = 0;

// start loop 
for (let i = 0 ; i < arr.length ; i++)
{
   if(arr[i] > largest){
    secondLargest = largest;
    largest = arr[i];
   }
   else if ( arr[i]>secondLargest && !arr[i] > largest ){
    secondLargest = arr[i];
   }
}

console.log("Largest:", largest);
console.log("Second Largest:", secondLargest);
*/

// function average(n){

//  if(n%2===0)
// {
//   console.log(n,""+ " is even number")

// }
// else if (n%2===1){
//   console.log(n,"is odd number")
// }
// }
// const result = average(10)
// console.log(result)


// ? find a single user using id

// const users = [
//   { id: 101, name: "Rahim" },
//   { id: 102, name: "Karim" },
//   { id: 103, name: "Reaz" },
// ];

// const newUsers=[];

// for (let i=0 ; i < users.length ; i++){
//     const userName = users[i]

//   newUsers.push(userName);
// }
// console.log(newUsers)


// const arr = [3, 5, 1, 2, 4, 7, 8, 9]

// const evenNum = [];
// for (const num of arr) {
//   if (num % 2 == 0) {
//     evenNum.push(num)
//   }
// }
// console.log(evenNum)

// const str = "hello";

// const reverse = str.split("").reverse().join("")
// console.log(reverse)


// ? reverse a string

// const str = "hello";

// let reverse= "";

// for (let i = str.length - 1; i >= 0; i--){
//   reverse= reverse+str[i]
// }

// console.log(reverse);

// ?count odd number
// const arr = [1, 2, 3, 4, 6, 7, 8];
// let count = 0;

// for (let i = 0; i < arr.length; i++){
//   if (arr[i]%2==1){
//     count++
//   }
// }
// console.log(count)
// ? remove duplicates
// const arr = [1, 2, 2, 3, 4, 4, 5];

// let num = []

// for (let i = 0; i<arr.length; i++){
//   if (!num.includes(arr[i])){
//     num.push(arr[i])
//   }
// }
// console.log(num)

// ? find duplicates
// const arr = [1, 2, 3, 2, 4, 5];

// let uniqueArr=[]
// let duplicate = null
// for (let i = 0 ; i <arr.length; i++){
//   if(!uniqueArr.includes(arr[i])){
//     uniqueArr.push(arr[i])
//   }
//   else {
//     duplicate=arr[i]

//   }
// }
// console.log(uniqueArr, duplicate)

const arr = [1, 2, 3, 2, 4, 5];

for (let i = 0; i < arr.length; i++) {
  for (let j = i + 1; j < arr.length; j++) {
    if (arr[i] === arr[j]) {
      console.log("Duplicate:", arr[i]);
    }
  }
}