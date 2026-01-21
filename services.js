import { postAnnotation,deleteAnnotation,updateAnnotation } from "./api.js";
import { baseURL, inputArray, markerArray,sviewer } from "./shared.js";
import * as THREE from "../libs/three.js/build/three.module.js";

export const addAnnotation = (data, cloudPoint) => {
    cloudPoint.addAnnotation(data.cordinates, {
        "title": data.title,
        "actions": [
            {
            "icon": Potree.resourcePath + "/icons/remove.svg",
            "onclick": async function (a) {
                await deleteAnnotation(data.id);
                cloudPoint.removeAnnotation(a.annotation);
            }
        } , 
        {
            "icon": Potree.resourcePath + "/icons/copy.svg",
            "onclick": function (a) {
                cleanIntermediateInput(sviewer);
                cloudPoint.removeAnnotation(a.annotation);
                console.log(a.annotation)
                annotationInputFactory(a.annotation.position, sviewer, cloudPoint, true, data);
            }
        }
    
    ]
    });
}


export const annotationInputFactory = (anchor, viewer, sceneLion,isUpdate=false, previousData=null) => {
    let annotaitonActionContainer = document.createElement('div');
    let annotationInput = document.createElement("input")
    let annotationSaveButton = document.createElement("button");
    let annotationCancelButton = document.createElement("button");

    annotaitonActionContainer.id = "input-div"
    annotaitonActionContainer.style.display = "flex";
    annotaitonActionContainer.appendChild(annotationInput);
    annotaitonActionContainer.appendChild(annotationSaveButton);
    annotaitonActionContainer.appendChild(annotationCancelButton);
    annotaitonActionContainer.style.position = "absolute";
    annotaitonActionContainer.style.zIndex = "100";

    // input box for annotation title
    annotationInput.value = isUpdate ? previousData.title : "";
    annotationInput.focus();
    annotationInput.id = 'ant-input'
    annotationInput.addEventListener("click", (event) => {
        event.stopPropagation();
    })

    annotationInput.addEventListener("input", (event) => {
        console.log(event);
        let length = new TextEncoder().encode(event.target.value).length
        console.log(length);
        if (length > 256) {
            annotationInput.style.border = "2px solid red";
            annotationSaveButton.disabled = true;
        } else {
            annotationInput.style.border = "none";
            annotationSaveButton.disabled = false;
        }
    })

    // save button
    annotationSaveButton.innerText = "Save"
    annotationSaveButton.id = "save-btn"

    annotationSaveButton.addEventListener("click", async (event) => {
        event.stopPropagation();
        const data = {
            id: Date.now().toString(),
            title: document.getElementById('ant-input').value,
            cordinates: [anchor.x, anchor.y, anchor.z],
            description: "nil"
        };
        if(isUpdate){
            data.id = previousData.id;
            await updateAnnotation(data);
        }else{
            await postAnnotation(data);
        }
        cleanIntermediateInput(viewer);
        addAnnotation(data, sceneLion);
    })

    // cancel button
    annotationCancelButton.innerText = "Cancel"
    annotationCancelButton.id = "cancel-btn"

    annotationCancelButton.addEventListener("click", (event) => {
        event.stopPropagation();
        cleanIntermediateInput(viewer);
        if(isUpdate){
            addAnnotation(previousData, sceneLion);
        }
    })

    // append to body
    document.body.append(annotaitonActionContainer);

    console.log("scn" , viewer);
    // position the input box
    const p = anchor.clone().project(viewer.scene.getActiveCamera());
    annotaitonActionContainer.style.left = (p.x * 0.5 + 0.5) * window.innerWidth + "px";
    annotaitonActionContainer.style.top = (-p.y * 0.5 + 0.5) * window.innerHeight + "px";
    inputArray.push(anchor);

    // add marker sphere in 3D scene
    const geometry = new THREE.SphereGeometry(0.05, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const sphere = new THREE.Mesh(geometry, material);

    sphere.position.copy(anchor);
    viewer.scene.scene.add(sphere);

    markerArray.push(sphere);


}


export const cleanIntermediateInput = (viewer) => {
    let inputDiv = document.getElementById('input-div');
    if (inputDiv) {
        inputDiv.remove();
        let marker = markerArray.pop();
        viewer.scene.scene.remove(marker);
    }
    inputArray.pop();
}


export const reCalibratePixels = (event , viewer) => {
    const anchor = inputArray[0];
    let input = document.getElementById(`input-div`)
    console.log(input);
    const p = anchor.clone().project(viewer.scene.getActiveCamera());
    input.style.left = (p.x * 0.5 + 0.5) * window.innerWidth + "px";
    input.style.top = (-p.y * 0.5 + 0.5) * window.innerHeight + "px";
}