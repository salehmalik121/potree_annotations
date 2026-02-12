export const baseURL = "https://dnq8wyve18.execute-api.ap-southeast-2.amazonaws.com";
export let inputArray = [];
export let markerArray = [];
export let sviewer = null;
export let annotationCount = 0;

export const setViewer = (viewer) => {
    sviewer = viewer;
}

export const setAnnotationCount = (count) => {
    annotationCount = count;
    const counter = document.getElementById("annotation_count");
    if (counter) {
        counter.innerText = count;
    }
}

export const incrementAnnotationCount = () => {
    setAnnotationCount(annotationCount + 1);
}

export const decrementAnnotationCount = () => {
    setAnnotationCount(Math.max(0, annotationCount - 1));
}
