let container, camera, renderer, scene, object, light, validSides, validBoxes, boxes,
    loader, unselectedSides, selectedSides, users, user, currentPlayer, box1, box2;

let players = document.querySelectorAll('.players .player');
let winner = document.querySelector('.winner'),
    winnerChildren = document.querySelectorAll('.winner div'),
    winPlayer = winnerChildren[0],
    score = winnerChildren[1];

function init() {
    container = document.querySelector('.container');

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 1, 1000);
    camera.position.set(0, 25, 0);
    camera.lookAt(scene.position);


    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    window.onresize = () => {
        renderer.setSize(container.clientWidth, container.clientHeight);
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
    };


    light = new THREE.PointLight(0xffffff, 1.5);
    light.position.set(0, 30, 0);
    scene.add(light);


    // geometries
    // ex geo
    const exGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 4);
    const mat = new THREE.MeshBasicMaterial();

    function ex(x, z, color) {
        let cylA = new THREE.Mesh(exGeo, mat);
        cylA.material.color.set(color);
        cylA.rotation.x = 1.6;
        cylA.rotation.z = -0.8;
        cylA.position.set(x, .55, z);
        scene.add(cylA);
        let cylB = new THREE.Mesh(exGeo, mat);
        cylB.material.color.set(color);
        cylB.rotation.z = 1.6;
        cylB.rotation.y = .8;
        cylB.position.set(x, .55, z);
        scene.add(cylB);
    };


    //ring geo
    const geometry = new THREE.RingGeometry(.5, .7, 10);
    const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });

    function ring(x, z, color) {
        let mesh = new THREE.Mesh(geometry, material);
        mesh.material.color.set(color);
        mesh.position.set(x, .55, z);
        mesh.rotation.x = 1.6;
        scene.add(mesh);
    };

    // players

    users = [{
            id: "player 1",
            name: "red",
            color: 0xff0000,
            points: 0
        },
        {
            id: "player 2",
            name: "blue",
            color: 0x0000ff,
            points: 0
        }
    ];

    user = 0;

    ////////////////////////////////////////////////


    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    loader = new THREE.GLTFLoader();
    loader.load('./3d/scene.gltf', function(gltf) {
        scene.add(gltf.scene);
        object = gltf.scene.children;

        validSides = object[0].children[1].children.filter(obj => obj.material);
        validBoxes = object[0].children[0].children.filter(obj => obj.material);

        unselectedSides = [];
        selectedSides = [];

        boxes = [];

        traversing();
        selectEdges();

        animate();
    });

    const textureLoader = new THREE.TextureLoader();
    const baseColor = textureLoader.load("./textures/edge.jpg");
    const normalMap = textureLoader.load("./textures/edgenormal.jpg");

    let selectEdges = () => {
        for (let i = unselectedSides.length - 1; i >= 0; i--) {
            if (unselectedSides[i].name.length == 5) {

                for (let x = 0; x < boxes.length; x++) {
                    if (boxes[x].name == unselectedSides[i].name.slice(0, -1)) {
                        boxes[x].sides += 1;
                    }
                }

                selectedSides.push(unselectedSides[i]);
                validSides[i].material.map = baseColor;
                validSides[i].material.normalMap = normalMap;
                unselectedSides.splice(i, 1);
                let removeEdges = validSides.splice(i, 1);
            }
        };
    }

    let traversing = () => {
        for (let i = validSides.length - 1; i >= 0; i--) {
            unselectedSides[i] = {
                mesh: validSides[i],
                name: validSides[i].name
            }
        };

        for (let i = 0; i < validBoxes.length; i++) {
            boxes.push({
                name: validBoxes[i].name,
                posx: validBoxes[i].position.x,
                posz: validBoxes[i].position.z,
                full: false,
                sides: 0
            });
        }
    }


    function onMouseMove(event) {
        event.preventDefault();

        // calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components

        mouse.x = (event.clientX / container.clientWidth) * 2 - 1;
        mouse.y = -(event.clientY / container.clientHeight) * 2 + 1;

    }

    function reset() {
        for (let i = 0; i < validSides.length; i++) {
            if (validSides[i].material) {
                validSides[i].material.opacity = 1;
                validSides[i].material.color.set(0xffffff);
                validSides[i].scale.set(1, 1, 1);
            }
        }
    }

    function hover() {
        raycaster.setFromCamera(mouse, camera);

        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(validSides, true);

        currentPlayer = users[user];

        if (intersects.length > 0) {
            intersects[0].object.material.opacity = .5;
            intersects[0].object.material.color.set(currentPlayer.color);
            intersects[0].object.scale.set(1.2, 1.2, 1)
        };
    }

    function click() {
        raycaster.setFromCamera(mouse, camera);

        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects(validSides, true);

        currentPlayer = users[user];

        if (intersects.length > 0) {
            intersects[0].object.material.opacity = 1;
            intersects[0].object.scale.set(1, 1, 1)
            intersects[0].object.material.color.set(currentPlayer.color);

            box1 = intersects[0].object.name.slice(0, 4);
            box2 = intersects[0].object.name.slice(5, 9);

            //ex(boxes[x].posx, boxes[x].posz, currentPlayer.color)
            //ring(boxes[x].posx, boxes[x].posz, currentPlayer.color)

            for (let x = 0; x < boxes.length; x++) {
                if (boxes[x].name == box1) {
                    boxes[x].sides += 1;
                    if (boxes[x].sides == 4) {
                        boxes[x].full = true;
                        if (user == 0) {
                            ex(boxes[x].posx, boxes[x].posz, currentPlayer.color)
                        } else {
                            ring(boxes[x].posx, boxes[x].posz, currentPlayer.color)
                        };
                        currentPlayer.points += 1;
                        ////////
                        players[user].querySelector(".points").innerHTML = currentPlayer.points;
                    }
                } else if (boxes[x].name == box2) {
                    boxes[x].sides += 1;
                    if (boxes[x].sides == 4) {
                        boxes[x].full = true;
                        if (user == 0) {
                            ex(boxes[x].posx, boxes[x].posz, currentPlayer.color)
                        } else {
                            ring(boxes[x].posx, boxes[x].posz, currentPlayer.color)
                        };
                        currentPlayer.points += 1;
                        ////////
                        players[user].querySelector(".points").innerHTML = currentPlayer.points;
                    }
                }
            };
            user = user == 0 ? 1 : 0;

            let removed = validSides.splice(validSides.indexOf(intersects[0].object), 1);
            for (let i = 0; i < unselectedSides.length; i++) {
                if (unselectedSides[i].name == removed[0].name) {
                    selectedSides.push(unselectedSides[i]);
                    unselectedSides.splice(i, 1);
                }
            }
        }

        if (unselectedSides.length == 0) {
            if (users[0].points > users[1].points) {
                winPlayer.innerHTML = `the winner is ${users[0].id}`;
                score.innerHTML = `your score is ${users[0].points}`;
                winner.classList.add('active');
                winner.classList.add('red');
            } else {
                winPlayer.innerHTML = `the winner is ${users[1].id}`;
                score.innerHTML = `your score is ${users[1].points}`;
                winner.classList.add('active');
                winner.classList.add('blue');
            }
        }

    }

    function animate() {
        requestAnimationFrame(animate);
        reset();
        hover();
        window.addEventListener('click', click);
        renderer.render(scene, camera);
    }

    window.addEventListener('mousemove', onMouseMove, false);
};


init();