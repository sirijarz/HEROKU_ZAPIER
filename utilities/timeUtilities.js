function srtTimestamp(ms){
    var $milliseconds = ms;
    
    $seconds = Math.floor($milliseconds / 1000);
    $minutes = Math.floor($seconds / 60);
    $hours = Math.floor($minutes / 60);
    $milliseconds = $milliseconds % 1000;
    $seconds = $seconds % 60;
    $minutes = $minutes % 60;
    return ($hours < 10 ? '0' : '') + $hours + ':'
         + ($minutes < 10 ? '0' : '') + $minutes + ':'
         + ($seconds < 10 ? '0' : '') + $seconds + ','
         + ($milliseconds < 100 ? '0' : '') + ($milliseconds < 10 ? '0' : '') + $milliseconds;
}

function timeStamp(ms){
    var $milliseconds = ms;
    
    $seconds = Math.floor($milliseconds / 1000);
    $minutes = Math.floor($seconds / 60);
    $hours = Math.floor($minutes / 60);
    $milliseconds = $milliseconds % 1000;
    $seconds = $seconds % 60;
    // $minutes = $minutes % 60;
    // return ($hours < 10 ? '0' : '') + $hours + ':'
    //      + ($minutes < 10 ? '0' : '') + $minutes + ':'
    //      + ($seconds < 10 ? '0' : '') + $seconds + ','
    //      + ($milliseconds < 100 ? '0' : '') + ($milliseconds < 10 ? '0' : '') + $milliseconds;
    return  ($minutes < 10 ? '0' : '') + $minutes + ':'
         + ($seconds < 10 ? '0' : '') + $seconds ;
}

module.exports = {
    srtTimestamp:srtTimestamp,
    timeStamp:timeStamp
}