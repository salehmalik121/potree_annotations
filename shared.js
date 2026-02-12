export const baseURL = "https://dnq8wyve18.execute-api.ap-southeast-2.amazonaws.com";

export let inputArray = [];
export let markerArray = [];
export let sviewer = null;
export let annotationCount = 0;
export let annotationsList = [];

let panelState = {
    search: "",
    sortBy: "newest"
};

let interactionHandlers = {
    onFocus: null
};

export const setViewer = (viewer) => {
    sviewer = viewer;
};

export const setAnnotationInteractionHandlers = (handlers = {}) => {
    interactionHandlers = {
        ...interactionHandlers,
        ...handlers
    };
    renderAnnotationsPanel();
};

const getFilteredAndSortedAnnotations = () => {
    const normalizedSearch = panelState.search.trim().toLowerCase();

    let filtered = annotationsList.filter((annotation) => {
        if (!normalizedSearch) {
            return true;
        }

        const title = (annotation.title || "").toLowerCase();
        return title.includes(normalizedSearch) || (annotation.id || "").includes(normalizedSearch);
    });

    if (panelState.sortBy === "title") {
        filtered.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else if (panelState.sortBy === "oldest") {
        filtered.sort((a, b) => Number(a.id || 0) - Number(b.id || 0));
    } else {
        filtered.sort((a, b) => Number(b.id || 0) - Number(a.id || 0));
    }

    return filtered;
};

const renderAnnotationsPanel = () => {
    const listElement = document.getElementById("annotations_list");
    const emptyState = document.getElementById("annotations_empty");
    const visibleCount = document.getElementById("visible_annotations_count");

    if (!listElement || !emptyState) {
        return;
    }

    listElement.innerHTML = "";

    const displayList = getFilteredAndSortedAnnotations();

    if (visibleCount) {
        visibleCount.innerText = `${displayList.length} shown`;
    }

    if (displayList.length === 0) {
        emptyState.style.display = "block";
        return;
    }

    emptyState.style.display = "none";

    displayList.forEach((annotation) => {
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

        const actions = document.createElement("div");
        actions.className = "annotation-item-actions";

        const focusBtn = document.createElement("button");
        focusBtn.className = "annotation-mini-btn";
        focusBtn.innerText = "Focus";
        focusBtn.onclick = () => {
            if (interactionHandlers.onFocus) {
                interactionHandlers.onFocus(annotation);
            }
        };

        const copyBtn = document.createElement("button");
        copyBtn.className = "annotation-mini-btn";
        copyBtn.innerText = "Copy XYZ";
        copyBtn.onclick = async () => {
            if (!hasCoords) {
                return;
            }
            const text = `${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)}`;
            try {
                await navigator.clipboard.writeText(text);
                copyBtn.innerText = "Copied";
                setTimeout(() => {
                    copyBtn.innerText = "Copy XYZ";
                }, 900);
            } catch {
                copyBtn.innerText = "Failed";
                setTimeout(() => {
                    copyBtn.innerText = "Copy XYZ";
                }, 900);
            }
        };

        actions.appendChild(focusBtn);
        actions.appendChild(copyBtn);

        item.appendChild(title);
        item.appendChild(location);
        item.appendChild(actions);
        listElement.appendChild(item);
    });
};

const bindPanelControls = () => {
    const searchInput = document.getElementById("annotations_search");
    const sortSelect = document.getElementById("annotations_sort");
    const exportButton = document.getElementById("export_annotations_btn");

    if (searchInput && !searchInput.dataset.bound) {
        searchInput.dataset.bound = "1";
        searchInput.addEventListener("input", (event) => {
            panelState.search = event.target.value;
            renderAnnotationsPanel();
        });
    }

    if (sortSelect && !sortSelect.dataset.bound) {
        sortSelect.dataset.bound = "1";
        sortSelect.addEventListener("change", (event) => {
            panelState.sortBy = event.target.value;
            renderAnnotationsPanel();
        });
    }

    if (exportButton && !exportButton.dataset.bound) {
        exportButton.dataset.bound = "1";
        exportButton.addEventListener("click", () => {
            const exportData = JSON.stringify(annotationsList, null, 2);
            const blob = new Blob([exportData], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `annotations-${Date.now()}.json`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        });
    }
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
    bindPanelControls();
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
