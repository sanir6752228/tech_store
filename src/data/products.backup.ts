export type ProductType = "single" | "stock";
export const products = [

{

id:1,

name:"iPhone 15 Pro",

price:890,

oldPrice:999,

category:"phones",

brand:"Apple",

condition:"used",

type:"single" as ProductType,

quantity:1,

storage:"256GB",

ram:"8GB",

color:"Black Titanium",

battery:89,

sim:"eSIM + Nano SIM",

display:"6.1 OLED Super Retina XDR",

processor:"Apple A17 Pro",

camera:"48 Мп + 12 Мп + 12 Мп",

year:2023,

rating:5,

reviews:124,

stock:true,

sales:87,

isNew:false,

isHit:true,

description:

"iPhone 15 Pro в отличном состоянии. Полностью проверен специалистами. Без скрытых дефектов.",

image:"/images/products/iphone.jpg"

},



{

id:2,

name:"Samsung Galaxy S25",

price:750,

oldPrice:850,

category:"phones",

brand:"Samsung",

condition:"new",

type:"stock" as ProductType,

quantity:15,

storage:"256GB",

ram:"12GB",

color:"Black",

battery:100,

sim:"Dual SIM",

display:"6.2 AMOLED 120Hz",

processor:"Snapdragon 8 Elite",

camera:"50 Мп + 10 Мп + 12 Мп",

year:2025,

rating:5,

reviews:98,

stock:true,

sales:54,

isNew:true,

isHit:true,

description:

"Новый Samsung Galaxy S25. Оригинальное устройство с официальной гарантией.",

image:"/images/products/samsung.jpg"

},



{

id:3,

name:"iPad Pro M4",

price:950,

category:"tablets",

brand:"Apple",

condition:"new",

type:"stock" as ProductType,

quantity:10,

storage:"512GB",

ram:"8GB",

color:"Silver",

battery:100,

display:"13 OLED Ultra Retina XDR",

processor:"Apple M4",

camera:"12 Мп",

year:2024,

rating:5,

reviews:76,

stock:true,

sales:31,

isNew:true,

isHit:false,

description:

"Мощный iPad Pro с процессором M4 для работы и творчества.",

image:"/images/products/ipad.jpg"

},



{

id:4,

name:"AirPods Pro 2",

price:250,

category:"accessories",

brand:"Apple",

condition:"new",

type:"stock" as ProductType,

quantity:25,

color:"White",

battery:100,

rating:4,

reviews:215,

stock:true,

sales:160,

isNew:false,

isHit:true,

description:

"Оригинальные AirPods Pro 2 с активным шумоподавлением.",

image:"/images/products/airpods.jpg"

},



{

id:5,

name:"iPhone 14",

price:550,

category:"phones",

brand:"Apple",

condition:"used",

type:"single" as ProductType,

quantity:1,

storage:"128GB",

ram:"6GB",

color:"Purple",

battery:84,

sim:"Nano SIM + eSIM",

display:"6.1 OLED Super Retina XDR",

processor:"Apple A15 Bionic",

camera:"12 Мп + 12 Мп",

year:2022,

rating:4,

reviews:89,

stock:true,

sales:42,

isNew:false,

isHit:false,

description:

"iPhone 14 в хорошем состоянии. Проверен нашими специалистами.",

image:"/images/products/iphone14.jpg"

},



{

id:6,

name:"Samsung Galaxy S24",

price:600,

category:"phones",

brand:"Samsung",

condition:"used",

type:"single" as ProductType,

quantity:1,

storage:"256GB",

ram:"8GB",

color:"Gray",

battery:91,

sim:"Dual SIM",

display:"6.2 AMOLED 120Hz",

processor:"Exynos 2400",

camera:"50 Мп + 10 Мп + 12 Мп",

year:2024,

rating:4,

reviews:67,

stock:false,

sales:28,

isNew:false,

isHit:false,

description:

"Samsung Galaxy S24 после проверки. Отличный вариант по доступной цене.",

image:"/images/products/s24.jpg"

}

];