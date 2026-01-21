import { baseURL } from './shared.js';

export async function loadAnnotations() {
    let response = await fetch(`${baseURL}/getAnnotation`);
    let data = await response.json();
    return data.data;
}

export async function postAnnotation(data) {
   const res = await fetch(`${baseURL}/addAnnotation`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })

    return res;
}

export async function deleteAnnotation(id){
    const res = await fetch(`${baseURL}/deleteAnnotation`, {
        method: "DELETE",
        body: JSON.stringify({id: id})
    })

    return res;
}

export async function updateAnnotation(data) {
   const res = await fetch(`${baseURL}/updateAnnotation`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })

    return res;
}