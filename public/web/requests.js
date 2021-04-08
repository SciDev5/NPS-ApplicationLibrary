

async function paramFetch(uri,queryParams) {
    var params = new URLSearchParams();
    if (queryParams) for (var i in queryParams) params.set(i,queryParams[i]);
    return await (await fetch(uri+(queryParams?"?"+params:""),{method:"get"})).json();
}

async function paramFetchPost(uri,body,queryParams) {
    var params = new URLSearchParams();
    if (queryParams) for (var i in queryParams) params.set(i,queryParams[i]);
    return await (await fetch(uri+(queryParams?"?"+params:""),{method:"post",body:body?JSON.stringify(body):"",headers:{"Content-Type":"application/json"}})).json();
}

export {paramFetch,paramFetchPost}