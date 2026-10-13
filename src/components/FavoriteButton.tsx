"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";


export default function FavoriteButton({

id

}:{

id:number

}){


const [favorite,setFavorite]=useState(false);



useEffect(()=>{


const favorites=JSON.parse(

localStorage.getItem("favorites") || "[]"

);



setFavorite(

favorites.includes(id)

);



},[id]);







function toggleFavorite(){


const favorites=JSON.parse(

localStorage.getItem("favorites") || "[]"

);



let updatedFavorites;



if(favorites.includes(id)){


updatedFavorites=favorites.filter(

(item:number)=>item!==id

);


}

else{


updatedFavorites=[

...favorites,

id

];


}




localStorage.setItem(

"favorites",

JSON.stringify(updatedFavorites)

);



setFavorite(

updatedFavorites.includes(id)

);



window.dispatchEvent(

new Event("favoritesUpdated")

);



}






return(

<button

onClick={(e)=>{


e.preventDefault();

e.stopPropagation();

toggleFavorite();


}}

className={`
absolute
top-4
right-4
z-20
w-11
h-11
rounded-full
flex
items-center
justify-center
shadow-lg
transition
hover:scale-110

${
favorite

?

"bg-red-500 text-white"

:

"bg-white text-gray-700"

}

`}

>


<Heart

size={24}

fill={favorite ? "currentColor" : "none"}

/>


</button>


)

}