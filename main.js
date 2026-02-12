import * as THREE from "../libs/three.js/build/three.module.js";
import { loadAnnotations } from "./api.js";
import { addAnnotation, annotationInputFactory, cleanIntermediateInput, reCalibratePixels } from "./services.js";
import { inputArray, setViewer, setAnnotationsList } from "./shared.js";

let isDown = false;

const viewer = new Potree.Viewer(document.getElementById("potree_render_area"));

viewer.setEDLEnabled(true);
viewer.setFOV(60);
viewer.setPointBudget(1_000_000);
viewer.setBackground("skybox");
viewer.loadSettingsFromURL();

let sceneLion = new Potree.Scene();

viewer.setScene(sceneLion);
Potree.loadPointCloud("./cloudpoint/cloud.js", "lion", async function (e) {
    sceneLion.addPointCloud(e.pointcloud);
    sceneLion.view.position.set(4.15, -6.12, 8.54);
    sceneLion.view.lookAt(new THREE.Vector3(0, -0.098, 4.23));
    e.pointcloud.material.pointSizeType = Potree.PointSizeType.ADAPTIVE;

    const data = await loadAnnotations();

    data.forEach((annotation) => {
        addAnnotation(annotation, sceneLion);
    });
    setAnnotationsList(data);

    viewer.fitToScreen();
});

document.addEventListener("click", (event) => {
    if (isDown) {
        return;
    }

    const mouse = new THREE.Vector2(event.clientX, event.clientY);
    let point = Potree.Utils.getMousePointCloudIntersection(
        mouse,
        viewer.scene.getActiveCamera(),
        viewer,
        viewer.scene.pointclouds,
        { pickClipped: false }
    );

    if (point != null) {
        cleanIntermediateInput(viewer);
        annotationInputFactory(point.location, viewer, sceneLion);
    }
});

document.addEventListener("mousedown", () => {
    isDown = true;
});

document.addEventListener("mouseup", () => {
    isDown = false;
});

document.addEventListener("mousemove", (event) => {
    if (isDown && inputArray.length != 0) {
        reCalibratePixels(event, viewer);
    }
});

document.addEventListener("wheel", (event) => {
    reCalibratePixels(event, viewer);
});

setViewer(viewer);
