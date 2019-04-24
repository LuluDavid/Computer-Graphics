// FUNCTIONS TO BUILD THE SOLAR SYSTEM

function addASphere(size,clr,position,parentNode,shadows=true){
	let geometry = new THREE.SphereGeometry( size, 32, 32 );
	let material = new THREE. MeshPhongMaterial({color:clr});
	if (shadows == false) {
		material = new THREE. MeshBasicMaterial({color:clr});
	}
	let sphere = new THREE.Mesh( geometry, material );
	sphere.position.set(position.x,position.y,position.z);
	parentNode.add(sphere);
	return sphere; //only for other use, if needed
}

function addAPlane(parentNode,opacity,scale){
	let brightGeo = new THREE.SphereGeometry( scale*10, 32, 32 );
	let brightMat = new THREE. MeshBasicMaterial({color:0xffffff,transparent:true,opacity:opacity});
	let brightSphere = new THREE.Mesh( brightGeo, brightMat );
	brightSphere.position.set(0,0,0);
	parentNode.add(brightSphere);
}

function addAPointLight(clr,position,parentNode){
	let light = new THREE.PointLight(clr,2,0,2);
	light.position.set(position.x,position.y,position.z);
	parentNode.add(light);
	return light;
}

function createGradient(startScale,endScale,startOpacity,endOpacity,numberOfPlanes){
	let planeGroup = new THREE.Group()
	let scaleRange = (endScale-startScale)/numberOfPlanes
	let opacityRange = (endOpacity-startOpacity)/numberOfPlanes
	while( startScale < endScale ){
		addAPlane( planeGroup, startOpacity, startScale )
		startScale += scaleRange
		startOpacity += opacityRange
	}
	return planeGroup
}

function buildScene(scene){
	// Add a light
	addAPointLight(0xffffff, {x:0,y:0,z:0},scene);
	// Add the axes helper
	let axes_size = 50
	let axesHelper = new THREE.AxesHelper(axes_size);
	addASphere(3, 0xff0000, {x:axes_size,y:0,z:0}, axesHelper, false)
	addASphere(3, 0x00ff00, {x:0,y:axes_size,z:0}, axesHelper, false)
	addASphere(3, 0x0000ff, {x:0,y:0,z:axes_size}, axesHelper, false)
	scene.add(axesHelper);
}

function buildAGroup(scene, numberOfPlanet, orbiteSize, centerSize, shadows, position, clr, minSpeed, maxSpeed){
	// Creating the group, setting its position
	let group = new THREE.Group();
	let speedRange = maxSpeed-minSpeed
	group.position.set(position.x,position.y,position.z)

	// Creating the central planet of the group: creating a pivot point, add a sphere and a random rotation speed to it 
	var pivotPoint, rayon, x, y, z
	pivotPoint = new THREE.Object3D()
	center = addASphere(centerSize,clr,{x:0,y:0,z:0},pivotPoint,shadows);

	pivotPoint.speed = (Math.random()*speedRange+minSpeed)*(Math.random()>0.5?1:-1)
	group.add(pivotPoint)

	// Creating all the planets composing the group; the size of a planet is between 1/5 and 3/5 of the central one
	for (let i=0;i<numberOfPlanet;i++){
		pivotPoint = new THREE.Object3D()
		rayon = (1+2*Math.random())*centerSize/5
		x = (centerSize+rayon)/(Math.sqrt(3))+Math.random()*orbiteSize*(Math.random()>0.5?1:-1)
		y = (centerSize+rayon)/(Math.sqrt(3))+Math.random()*orbiteSize*(Math.random()>0.5?1:-1)
		z = (centerSize+rayon)/(Math.sqrt(3))+Math.random()*orbiteSize*(Math.random()>0.5?1:-1)
		addASphere(rayon,getRandomColor(),{x:x,y:y,z:z},pivotPoint)
		pivotPoint.speed = (Math.random()*speedRange+minSpeed)*(Math.random()>0.5?1:-1)
		group.add(pivotPoint)
	}

	scene.add(group);
	return group
}

function addToGroup(group,child,minSpeed,maxSpeed){
	// Creating a pivot point and a rotation speed for the group
	let pivotPoint = new THREE.Object3D()
	let speedRange = maxSpeed-minSpeed
	pivotPoint.speed = (Math.random()*speedRange+minSpeed)*(Math.random()>0.5?1:-1)
	pivotPoint.add(child)
	group.add(pivotPoint)
}

function getRandomColor() {
	let red = Math.floor(Math.random()*255);
	let blue = Math.floor(Math.random()*255);
	let green = Math.floor(Math.random()*255);
	let color_string = "rgb("+red+", "+green+", "+blue+")"
	let res = new THREE.Color(color_string);
	return res;
	}







// FUNCTIONS TO BUILD THE FRUSTRUM

function buildFrustrum(scenePosition, views){
	var nearTopMiddle
	let frustrum = new THREE.Group()
	let view = views[0]

	// Build camera representation
	let cameraSphere = addASphere(5,0xffff00,view.camera.position,frustrum,shadows=false)

	// Define vectors
	let cameraUp = (view.camera.up.clone()).normalize()
	let cameraLook = new THREE.Vector3(scenePosition.x,scenePosition.y,scenePosition.z)
	let cameraPosition = new THREE.Vector3(view.camera.position.x,view.camera.position.y,view.camera.position.z)
	let lookAt = cameraLook.clone().addScaledVector(cameraPosition.clone(),-1).normalize()
	let rightVector = lookAt.clone().cross(cameraUp.clone())
	
	// Get the 2 plane's dimensions
	let farplaneHeight = 2*Math.tan(Math.PI*view.camera.fov/360)*view.camera.far
	let farplaneWidth = farplaneHeight*view.width/view.height
	let nearplaneHeight = 2*Math.tan(Math.PI*view.camera.fov/360)*view.camera.near
	let nearplaneWidth = nearplaneHeight*view.width/view.height

	// Get the 2 plane's centers
	let farplaneCenter = cameraPosition.clone().addScaledVector(lookAt.clone(),view.camera.far) 
	let nearplaneCenter = cameraPosition.clone().addScaledVector(lookAt.clone(),view.camera.near) 

	// Generate the 2 plane's edges
	let planeEdgesFar = generateEdges(farplaneCenter,farplaneHeight,farplaneWidth,cameraUp,rightVector)
	let planeEdgesNear = generateEdges(nearplaneCenter,nearplaneHeight,nearplaneWidth,cameraUp,rightVector)
	let planeEdges = planeEdgesFar.concat(planeEdgesNear)

	// Get the Up vector's end
	nearTopMiddle = nearplaneCenter.clone().addScaledVector(cameraUp,0.5*nearplaneHeight)
	
	// Connect the Edges of each plane to the camera
	let LineSeg = connectEdges(cameraPosition,planeEdges)
	frustrum.add(LineSeg)

	// Create the 2 plane's mesh
	let NearPlaneMesh = createPlan(planeEdges.slice(0,4),0xffff00)
	let FarPlaneMesh = createPlan(planeEdges.slice(4,8),0x00ffff)
	frustrum.add(NearPlaneMesh)
	frustrum.add(FarPlaneMesh)

	// Create the position vector
	let centralSeg = drawVector(cameraPosition,scenePosition,0xff0000)
	frustrum.add(centralSeg);

	// Create the Up vector representation
	let upSeg = drawVector(nearplaneCenter,nearTopMiddle,0x00ff00)
	addASphere(2,0x00ff00,nearTopMiddle,frustrum,shadows=false)
	frustrum.add(upSeg);

	// // Update the light gradient to make it transparent above the frustrum planes
	// updateLight()
	
	//scene.add(frustrum);
	return frustrum


}

function generateEdges(Center,Height,Width,Up,Vector){
		Up = Up.clone().multiplyScalar(Height)
		Vector = Vector.clone().multiplyScalar(Width)

		let topLeft = (Center.clone().addScaledVector(Up,0.5)).addScaledVector(Vector,-0.5)
		let topRight = (Center.clone().addScaledVector(Up,0.5)).addScaledVector(Vector,0.5)
		let bottomLeft = (Center.clone().addScaledVector(Up,-0.5)).addScaledVector(Vector,-0.5)
		let bottomRight = (Center.clone().addScaledVector(Up,-0.5)).addScaledVector(Vector,0.5)
		return [topLeft.clone(),topRight.clone(),bottomLeft.clone(),bottomRight.clone()]
	}

function connectEdges(cameraPosition,planeEdges){
	let geometry = new THREE.Geometry
	let clr = new THREE.Color("rgb(0, 255, 0)");
	let material = new THREE.LineBasicMaterial({color: clr});
	for (let i=0;i<planeEdges.length;i++){
		geometry.vertices.push(cameraPosition)
		geometry.vertices.push(planeEdges[i])
	}
	return new THREE.LineSegments( geometry, material );
}

function createPlan(planeEdges,clr){
	let quadGeometry = new THREE.Geometry()
	for (let i=0;i<planeEdges.length;i++){
		quadGeometry.vertices.push(planeEdges[i])
	}
	quadGeometry.faces.push(new THREE.Face3(2,1,0))
	quadGeometry.faces.push(new THREE.Face3(1,2,3))

	material = new THREE.MeshBasicMaterial({opacity: 0.5, transparent:true, color:clr, side:THREE.DoubleSide})
	return new THREE.Mesh(quadGeometry,material)
}

function drawVector(beginning,end,clr){
	geometry = new THREE.Geometry()
	material = new THREE.LineBasicMaterial({color: clr});
	geometry.vertices.push(beginning)
	geometry.vertices.push(end)
	return new THREE.LineSegments( geometry, material );
}








// FUNCTIONS TO UPDATE THE VIEWS WITH SLIDERS

function updateCameraFov(){
	var slider = document.getElementById('FovRange')
	var value = parseInt(slider.value)
	var view = views[0]
	view.camera.fov = value
	view.updateCamera( view.camera, scene )
	scene.children[4] = buildFrustrum(scene.position,views)
	views[1].updateCamera( views[1].camera, scene)
}

function updateCameraTheta(){
	var slider = document.getElementById('upRange')
	var value = parseInt(slider.value)
	var view = views[0]
	view.camera.up = new THREE.Vector3()
	view.updateCamera( view.camera, scene )
	scene.children[4] = buildFrustrum(scene.position,views)
	views[1].updateCamera( views[1].camera, scene)
}

function updateCameraUp(){
	var sliderTheta = document.getElementById('thetaRange')
	var theta = parseInt(sliderTheta.value)*Math.PI/180
	var phi = Math.PI/2
	var view = views[0]
	view.camera.up = new THREE.Vector3(Math.sin(theta)*Math.cos(phi),Math.sin(theta)*Math.sin(phi),Math.cos(theta))
	view.updateCamera( view.camera, scene )
	scene.children[4] = buildFrustrum(scene.position,views)
	views[1].updateCamera( views[1].camera, scene)
}

function updateCameraX(slider,view){
	var value = parseInt(slider.value)
	view.camera.position.x = value
	scene.children[4] = buildFrustrum(scene.position,views)
	views[0].updateCamera( views[0].camera, scene )
	views[1].updateCamera( views[1].camera, scene )
}

function updateCameraY(slider,view){
	var value = parseInt(slider.value)
	view.camera.position.y = value
	scene.children[4] = buildFrustrum(scene.position,views)
	views[0].updateCamera( views[0].camera, scene )
	views[1].updateCamera( views[1].camera, scene )
}

function updateCameraZ(slider,view){
	var value = parseInt(slider.value)
	view.camera.position.z = value
	scene.children[4] = buildFrustrum(scene.position,views)
	views[0].updateCamera( views[0].camera, scene )
	views[1].updateCamera( views[1].camera, scene )
}

function updateCameraNear(){
	var slider = document.getElementById('nearRange')
	var value = parseInt(slider.value)
	var view = views[0]
	view.camera.near = value
	view.updateCamera( view.camera, scene )
	scene.children[4] = buildFrustrum(scene.position,views)
	views[1].updateCamera( views[1].camera, scene)
}

function updateCameraFar(){
	var slider = document.getElementById('farRange')
	var value = parseInt(slider.value)
	var view = views[0]
	view.camera.far = value
	view.updateCamera( view.camera, scene )
	scene.children[4] = buildFrustrum(scene.position,views)
	views[1].updateCamera( views[1].camera, scene)
}

function updateLight(){
	var slider = document.getElementById('lightRange')
	var value = slider.value
	scene.children[0].intensity = slider.value
	scene.children[2] = createGradient(startScale = value/2,endScale = value*3/2, startOpacity = 0.05*value, endOpacity = 0, numberOfPlanes = 10*value)
}




















console.log("DBG: helperFns.js loaded");
