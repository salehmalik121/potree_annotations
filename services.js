import { postAnnotation, deleteAnnotation, updateAnnotation } from "./api.js";
import {
    inputArray,
    markerArray,
    sviewer,
    upsertAnnotationInList,
    removeAnnotationFromList
} from "./shared.js";
import * as THREE from "../libs/three.js/build/three.module.js";

export const addAnnotation = (data, cloudPoint, syncPanel = false) => {
    cloudPoint.addAnnotation(data.cordinates, {
        title: data.title,
        actions: [
            {
                icon: Potree.resourcePath + "/icons/remove.svg",
                onclick: async function (a) {
                    await deleteAnnotation(data.id);
                    cloudPoint.removeAnnotation(a.annotation);
                    removeAnnotationFromList(data.id);
                }
            },
            {
                icon: Potree.resourcePath + "/icons/copy.svg",
                onclick: function (a) {
                    cleanIntermediateInput(sviewer);
                    cloudPoint.removeAnnotation(a.annotation);
                    annotationInputFactory(a.annotation.position, sviewer, cloudPoint, true, data);
                }
            }
        ]
    });

    if (syncPanel) {
        upsertAnnotationInList(data);
    }
};

export const annotationInputFactory = (anchor, viewer, sceneLion, isUpdate = false, previousData = null) => {
    let annotationActionContainer = document.createElement("div");
    let annotationInput = document.createElement("input");
    let annotationSaveButton = document.createElement("button");
    let annotationCancelButton = document.createElement("button");

    annotationActionContainer.id = "input-div";
    annotationActionContainer.appendChild(annotationInput);
    annotationActionContainer.appendChild(annotationSaveButton);
    annotationActionContainer.appendChild(annotationCancelButton);
    annotationActionContainer.style.position = "absolute";
    annotationActionContainer.style.zIndex = "100";

    annotationInput.value = isUpdate ? previousData.title : "";
    annotationInput.placeholder = "Add an annotation title";
    annotationInput.maxLength = 256;
    annotationInput.focus();
    annotationInput.id = "ant-input";
    annotationInput.addEventListener("click", (event) => {
        event.stopPropagation();
    });

    const validateInput = () => {
        const bytes = new TextEncoder().encode(annotationInput.value.trim()).length;
        const isInvalid = bytes === 0 || bytes > 256;
        annotationSaveButton.disabled = isInvalid;
        annotationInput.style.border = isInvalid ? "2px solid #ff5c7a" : "1px solid #d5ddf0";
        return !isInvalid;
    };

    annotationInput.addEventListener("input", validateInput);
    annotationInput.addEventListener("keydown", async (event) => {
        if (event.key === "Enter" && validateInput()) {
            annotationSaveButton.click();
        }
    });

    annotationSaveButton.innerText = "Save";
    annotationSaveButton.id = "save-btn";

    annotationSaveButton.addEventListener("click", async (event) => {
        event.stopPropagation();

        if (!validateInput()) {
            return;
        }

        const data = {
            id: Date.now().toString(),
            title: annotationInput.value.trim(),
            cordinates: [anchor.x, anchor.y, anchor.z],
            description: "nil"
        };

        if (isUpdate) {
            data.id = previousData.id;
            await updateAnnotation(data);
        } else {
            await postAnnotation(data);
        }

        cleanIntermediateInput(viewer);
        addAnnotation(data, sceneLion, true);
    });

    annotationCancelButton.innerText = "Cancel";
    annotationCancelButton.id = "cancel-btn";

    annotationCancelButton.addEventListener("click", (event) => {
        event.stopPropagation();
        cleanIntermediateInput(viewer);
        if (isUpdate) {
            addAnnotation(previousData, sceneLion, false);
        }
    });

    document.body.append(annotationActionContainer);
    validateInput();

    const p = anchor.clone().project(viewer.scene.getActiveCamera());
    annotationActionContainer.style.left = (p.x * 0.5 + 0.5) * window.innerWidth + "px";
    annotationActionContainer.style.top = (-p.y * 0.5 + 0.5) * window.innerHeight + "px";
    inputArray.push(anchor);

    const geometry = new THREE.SphereGeometry(0.05, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.copy(anchor);
    viewer.scene.scene.add(sphere);
    markerArray.push(sphere);
};

export const cleanIntermediateInput = (viewer) => {
    const inputDiv = document.getElementById("input-div");
    if (inputDiv) {
        inputDiv.remove();
        const marker = markerArray.pop();
        if (marker) {
            viewer.scene.scene.remove(marker);
        }
    }
    inputArray.pop();
};

export const reCalibratePixels = (event, viewer) => {
    const anchor = inputArray[0];
    const input = document.getElementById("input-div");
    if (!anchor || !input) {
        return;
    }
    const p = anchor.clone().project(viewer.scene.getActiveCamera());
    input.style.left = (p.x * 0.5 + 0.5) * window.innerWidth + "px";
    input.style.top = (-p.y * 0.5 + 0.5) * window.innerHeight + "px";
};
