export const baseURL = "https://dnq8wyve18.execute-api.ap-southeast-2.amazonaws.com";
export let inputArray = [];
export let markerArray = [];
export let sviewer = null;
export let annotationCount = 0;
export let annotationsList = [];

export const setViewer = (viewer) => {
    sviewer = viewer;
};

const renderAnnotationsPanel = () => {
    const listElement = document.getElementById("annotations_list");
    const emptyState = document.getElementById("annotations_empty");

    if (!listElement || !emptyState) {
        return;
    }

    listElement.innerHTML = "";

    if (annotationsList.length === 0) {
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";

    annotationsList.forEach((annotation) => {
        const item = document.createElement("li");
        item.className = "annotation-item";

        const title = document.createElement("div");
        title.className = "annotation-item-title";
        title.innerText = annotation.title || "Untitled annotation";

        const location = document.createElement("div");
        location.className = "annotation-item-meta";
        const [x, y, z] = annotation.cordinates || [];
        const hasCoords = Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z);
        location.innerText = hasCoords
            ? `x:${x.toFixed(2)} y:${y.toFixed(2)} z:${z.toFixed(2)}`
            : "Coordinates unavailable";

        item.appendChild(title);
        item.appendChild(location);
        listElement.appendChild(item);
    });
};

export const setAnnotationCount = (count) => {
    annotationCount = count;
    const counter = document.getElementById("annotation_count");
    if (counter) {
        counter.innerText = count;
    }
};

export const setAnnotationsList = (annotations) => {
    annotationsList = Array.isArray(annotations) ? [...annotations] : [];
    setAnnotationCount(annotationsList.length);
    renderAnnotationsPanel();
};

export const upsertAnnotationInList = (annotation) => {
    const index = annotationsList.findIndex((item) => item.id === annotation.id);
    if (index === -1) {
        annotationsList.push(annotation);
    } else {
        annotationsList[index] = annotation;
    }

    setAnnotationCount(annotationsList.length);
    renderAnnotationsPanel();
};

export const removeAnnotationFromList = (annotationId) => {
    annotationsList = annotationsList.filter((annotation) => annotation.id !== annotationId);
    setAnnotationCount(annotationsList.length);
    renderAnnotationsPanel();
};
