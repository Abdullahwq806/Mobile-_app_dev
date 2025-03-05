let arr = [10, 20, 30, 40, 50];

console.log(arr.length);  

arr.push(60);
console.log(arr); 

arr.pop();
console.log(arr);  

arr.shift();
console.log(arr);  

arr.unshift(10);
console.log(arr);  

console.log(arr.slice(1, 3));  

arr.splice(2, 1, 99);
console.log(arr); 

console.log(arr.indexOf(40)); 

console.log(arr.includes(50));  

console.log(arr.reverse());  

console.log(arr.sort((a, b) => a - b));  

console.log(arr.join(" - "));  

arr.forEach(num => console.log(num * 2)); 

let mappedArr = arr.map(num => num * 2);
console.log(mappedArr);  

let filteredArr = arr.filter(num => num > 30);
console.log(filteredArr);  

let sum = arr.reduce((acc, num) => acc + num, 0);
console.log(sum); 

console.log(arr.some(num => num > 50)); 

console.log(arr.every(num => num > 5)); 

console.log(arr.find(num => num > 30));  

console.log(arr.findIndex(num => num > 30));