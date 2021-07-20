var express = require('express');




function flattenArray(multiArray){
    var merged  =  Array.prototype.concat.apply([],multiArray)
    return merged
}

function toHashMap(array){
    var map = {};
    array.sort();
    for(var i = 0; i < array.length; i++ ){
        if(array[i] in map){
            //console.log(array[i]+" "+map.get(array[i]))
            map[array[i]] = map[array[i]] + 1;
        }else{
            map[array[i]] = 1;
        }
    }
    // console.log(map)
    return map;
}

function toObject(hash,limit){
    var objArray = []
    var keys = Object.keys(hash);
    //console.log(keys)
    // for(var i = 0 ; i < (keys.length && limit) ; i++){
    for(var i = 0 ; i < keys.length ; i++){
        if(keys[i] != undefined){
            obj = {};
            obj.name = keys[i];
            obj.value = hash[keys[i]];
            // console.log(obj.name+" "+obj.value)
            objArray.push(obj);
        }        
    }
    objArray.sort((a,b) => (a.value > b.value) ? -1 : ((b.value > a.value) ? 1 : 0)); 
    return objArray;
}

module.exports = {flattenArray,toHashMap,toObject};