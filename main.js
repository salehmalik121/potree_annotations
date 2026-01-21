		import * as THREE from "../libs/three.js/build/three.module.js";
		import { loadAnnotations,postAnnotation } from "./api.js";
		import  {addAnnotation , annotationInputFactory, cleanIntermediateInput, reCalibratePixels} from "./services.js";
		import { baseURL , inputArray , markerArray, setViewer } from "./shared.js";

		let isDown = false;


		const viewer = new Potree.Viewer(
			document.getElementById("potree_render_area")
		);

		

		viewer.setEDLEnabled(true);
		viewer.setFOV(60);
		viewer.setPointBudget(1_000_000);
		viewer.setBackground("skybox");
		viewer.loadSettingsFromURL();


		let sceneLion = new Potree.Scene();

		viewer.setScene(sceneLion);
		// loading point cloud lion
		Potree.loadPointCloud("./cloudpoint/cloud.js", "lion", async function (e) {

			// setting scene lion view and adding point cloud to scene
			sceneLion.addPointCloud(e.pointcloud);
			sceneLion.view.position.set(4.15, -6.12, 8.54);
			sceneLion.view.lookAt(new THREE.Vector3(0, -0.098, 4.23));
			e.pointcloud.material.pointSizeType = Potree.PointSizeType.ADAPTIVE;

			// load annotaions from dynomoDB via API Gateway
			const data = await loadAnnotations();
			
			// then we are looping in api when screen loading and adding annotations to screen
			data.forEach(annotations => {
				addAnnotation(annotations, sceneLion);
			});

			viewer.fitToScreen();
		});



		// Event Listeners for Click , Mouse Down , Mouse Up , Mouse Move , Wheel

		// When Click Event is Fired we will create input bar at the point clicked
		document.addEventListener("click", (event) => {

			console.log("click event");

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
			)
			const anchor = point.location;
			if (point != null) {
				cleanIntermediateInput(viewer);
				annotationInputFactory(anchor,viewer,sceneLion);
			}


		});

		document.addEventListener("mousedown", (event) => {
			isDown = true;
		})
		document.addEventListener("mouseup", (event) => {
			isDown = false;
		})

		document.addEventListener("mousemove", (event) => {
			if (isDown && inputArray.length != 0) {
				reCalibratePixels(event, viewer);
			}
		})

		document.addEventListener("wheel", (event) => {
			reCalibratePixels(event)
		})

		setViewer(viewer);