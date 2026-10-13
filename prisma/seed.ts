import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


async function main() {


const categories = [

{
name:"Телефоны",
slug:"phones"
},

{
name:"Планшеты",
slug:"tablets"
},

{
name:"Ноутбуки",
slug:"laptops"
},

{
name:"Зарядки",
slug:"chargers"
},

{
name:"Кабели",
slug:"cables"
},

{
name:"Наушники",
slug:"headphones"
},

{
name:"Аксессуары",
slug:"accessories"
},

{
name:"Ремонт",
slug:"repair"
}

];


for (const category of categories) {


await prisma.category.upsert({

where:{
slug:category.slug
},

update:{},

create:category

});


}


console.log("Категории созданы");


}


main()

.catch((e)=>{

console.error(e);

process.exit(1);

})

.finally(async()=>{

await prisma.$disconnect();

});