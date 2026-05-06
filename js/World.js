export class World {
    constructor(scene, mapId) {
        this.targetBuilding = null;
        this.scene = scene;
        this.cellSize = 10;
        this.trafficLights = [];
        this.buildingsData = [];
        this.trafficLightStatus = "GREEN";
        this.mapId = mapId;

        this.loadMapData();
    
        this.mapRows = this.mapData.length;
        this.mapCols = this.mapData[0].length;
        this.offsetX = - (this.mapCols * this.cellSize) / 2;
        this.offsetZ = - (this.mapRows * this.cellSize) / 2;

        this.modelCache = new Map();
        this.loader = new THREE.GLTFLoader();
        
        this.startTrafficLights();
        this.startTargetBlink();

    }

    loadMapData() {
        this.mapData = (this.mapId == 2) 
            ? this.getMapThongNhat() 
            : this.getMapUET();
    } 
  
    getMapUET() {
        return [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 11, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 11, 1, 0],
            [0, 1, 1, 1, 0, 0, 5, 0, 0, 0, 4, 0, 1, 1, 1, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 25, 0, 0, 0, 1, 1, 1, 0, 4, 0, 0, 6, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 11, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 17, 0, 0, 0, 18, 0, 0, 1, 1, 1, 0, 21, 0, 0, 17, 0, 0, 21, 0, 0, 0, 18, 0, 0, 1, 1, 1, 0, 21, 0, 0, 21, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 11, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 67, 67, 67, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 67, 67, 67, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 67, 67, 67, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 67, 67, 67, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 67, 67, 67, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 67, 67, 67, 1, 1, 1, 1, 1, 1, 11, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 11, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 11, 1, 0, 0, 9, 0, 0, 0, 27, 0, 1, 1, 1, 0, 14, 0, 1, 1, 1, 1, 1, 0, 13, 0, 0, 27, 0, 1, 1, 1, 0, 30, 0, 0, 14, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 11, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 11, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 0, 0, 18, 0, 0, 0, 17, 0, 1, 1, 1, 0, 21, 0, 1, 1, 1, 1, 1, 0, 21, 0, 0, 17, 0, 1, 1, 1, 0, 21, 0, 0, 21, 0, 0, 17, 0, 0],
            [0, 11, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 26, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 4, 0, 0, 6, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 11, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 28, 0, 0, 0, 0, 0, 0, 0, 0, 0, 24, 0, 0, 1, 11, 1, 1, 1, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 0, 16, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 11, 1, 0, 0, 0, 0, 21, 0, 0, 17, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 21, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 11, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 5, 0, 0, 0, 0, 15, 0, 0, 1, 1, 1, 0, 0, 0, 25, 0, 0, 0, 0, 0, 5, 0, 0, 1, 1, 1, 0, 6, 0, 0, 4, 0, 1, 1, 1, 0, 6, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
            [0, 0, 17, 0, 0, 0, 0, 29, 0, 0, 0, 1, 1, 1, 0, 0, 18, 0, 0, 0, 0, 0, 29, 0, 0, 0, 1, 1, 1, 0, 21, 0, 0, 17, 0, 1, 1, 1, 0, 21, 0, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 11, 1, 1, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 67, 67, 67, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 67, 67, 67, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 67, 67, 67, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 22, 0, 0, 0, 1, 1, 1, 0, 0, 15, 0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 50, 50, 51, 50, 50, 50, 0, 0, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 11, 1, 1, 1, 0, 0, 0, 0, 0, 7, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ];
    } 
 
    getMapThongNhat() {
        return [
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            [0, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 11, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 44, 0, 0, 0, 0, 1, 11, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 11, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 11, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 11, 1, 1, 1, 0],
            [0, 1, 1, 11, 1, 0, 0, 888, 0, 0, 0, 888, 0, 0, 0, 888, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 11, 1, 0, 666, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 0, 0, 0, 0, 555, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 67, 67, 67, 67, 67, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 67, 67, 67, 67, 67, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 67, 67, 67, 67, 67, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 11, 1, 1, 33, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 67, 67, 67, 67, 67, 11, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 67, 67, 67, 67, 67, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 11, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 11, 1, 1, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
            [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 11, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
            [0, 1, 1, 11, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 1, 1, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
            [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 3333, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 777, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 51, 444, 0, 0, 77, 0, 0, 0, 0, 0, 0, 66, 0, 0, 0, 1, 1, 0],
            [0, 11, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 11, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
            [0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 11, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 11, 1, 1, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
            [0, 1, 1, 11, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 1, 1, 50, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 67, 67, 67, 67, 67, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 67, 67, 67, 67, 67, 11, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 11, 67, 67, 67, 67, 67, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 67, 67, 67, 67, 67, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 67, 67, 67, 67, 67, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 11, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 0, 0, 0, 1, 11, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 11, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1111, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 11, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 11, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 11, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 11, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
            [0, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 0],
            [0, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 11, 1, 1, 1, 1, 0],
            [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        ]; 
    }


    async init() {
        const modelConfigs = {
            10: { path: 'assets/models/nhadienthoai.glb', scale: 1 }, //uet
            3: { path: 'assets/models/hospital.glb', scale: 1 }, //hospitalN
            4: { path: 'assets/models/33_1.glb', scale: 1 }, //building3x3_1N
            5: { path: 'assets/models/building3x5.glb', scale: 1 }, //building3x5N
            6: { path: 'assets/models/building3x3.glb', scale: 1 }, //building3x3N
            7: { path: 'assets/models/buichuoi.glb', scale: 1 }, //smallhouse2
            8: { path: 'assets/models/daiphunnuoc.glb', scale: 1 }, //daiphunnuoc
            9: { path: 'assets/models/55_1.glb', scale: 1 }, //5x5_1N
            12: { path: 'assets/models/skyscraper.glb', scale: 1 }, //skyscraperN
            13: { path: 'assets/models/shop.glb', scale: 1 },//shopW
            14: { path: 'assets/models/shop2.glb', scale: 1 }, //shopE
            15: { path: 'assets/models/shop3.glb', scale: 1 }, //shopN
            16: { path: 'assets/models/ballyard.glb', scale: 1 },
            17: { path: 'assets/models/33_2.glb', scale: 1 },
            18: { path: 'assets/models/35_2.glb', scale: 1 },
            19: { path: 'assets/models/car2.glb', scale: 1 },
            20: { path: 'assets/models/33_222.glb', scale: 1 },
            21: { path: 'assets/models/33_22S.glb', scale: 1 },
            22: { path: 'assets/models/bakery3x7N.glb', scale: 1 },
            23: { path: 'assets/models/market.glb', scale: 1 },
            24: { path: 'assets/models/restaurant.glb', scale: 1 },
            25: { path: 'assets/models/dinning.glb', scale: 1 },
            26: { path: 'assets/models/daiphunnuoc.glb', scale: 1 },
            27: { path: 'assets/models/27E3x5.glb', scale: 1 },
            28: { path: 'assets/models/28.glb', scale: 1 },
            29: { path: 'assets/models/29.glb', scale: 1 },
            30: { path: 'assets/models/30.glb', scale: 1 },
            33: { path: 'assets/models/thacthac.glb', scale: 1 }, //thác nước
            44: { path: 'assets/models/bong.glb', scale: 1 }, //sân bóng
            66: { path: 'assets/models/2park2.glb', scale: 1 }, //park2
            77: { path: 'assets/models/park1.glb', scale: 1 }, //park1
            222: { path: 'assets/models/2toa.glb', scale: 1 }, //thác nước
            444: { path: 'assets/models/cong.glb', scale: 1 }, //cổng công viên thống nhất
            555: { path: 'assets/models/nhachuoi.glb', scale: 1 }, //chuỗi nhà x1
            666: { path: 'assets/models/chuoinha.glb', scale: 1 }, //chuỗi nhà x2
            777: { path: 'assets/models/daynha.glb', scale: 1 }, //chuỗi nhà x2
            888: { path: 'assets/models/nhadan.glb', scale: 1 }, //nhà dân
            1111: { path: 'assets/models/bvien.glb', scale: 1 }, // nhà thi đấu
            3333: { path: 'assets/models/school.glb', scale: 1 } // school
        };

        const promises = Object.entries(modelConfigs).map(([key, config]) => {
            return new Promise((resolve) => {
                this.loader.load(config.path, (gltf) => {
                    this.modelCache.set(parseInt(key), gltf.scene);
                    resolve();
                }, undefined, () => resolve());
            });
        });
        await Promise.all(promises);
        this.buildWorld();
    }

    buildWorld() {
        const roadGeo = new THREE.PlaneGeometry(this.cellSize, this.cellSize);
        const roadMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const sidewalkSize = this.cellSize - 0.2;
        const sidewalkGeo = new THREE.BoxGeometry(sidewalkSize, 0.5, sidewalkSize);
        const sidewalkMat = new THREE.MeshStandardMaterial({ color: 0x95a5a6 });

        for (let row = 0; row < this.mapRows; row++) {
            for (let col = 0; col < this.mapCols; col++) {
                const x = this.offsetX + col * this.cellSize + this.cellSize / 2;
                const z = this.offsetZ + row * this.cellSize + this.cellSize / 2;
                const val = this.mapData[row][col];

                if (val === 1 || val === 11) {
                    const road = new THREE.Mesh(roadGeo, roadMat);
                    road.rotation.x = -Math.PI / 2;
                    road.position.set(x, 0, z);
                    road.receiveShadow = true;
                    this.scene.add(road);
                        if (val === 11) {
                            const marker = new THREE.Mesh(
                                new THREE.CircleGeometry(this.cellSize / 3, 32),
                                new THREE.MeshBasicMaterial({ color: 0xffff00, transparent: true, opacity: 0.25 })
                            );
                            marker.rotation.x = -Math.PI / 2;
                            marker.position.set(x, 0.02, z);
                            this.scene.add(marker);
                        }
                } 
                else if (val === 67) {
                    const junctionGeom = new THREE.PlaneGeometry(this.cellSize, this.cellSize);
                    const junctionMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
                    const junction = new THREE.Mesh(junctionGeom, junctionMat);
                    junction.rotation.x = -Math.PI / 2;
                    junction.position.set(x, 0.05, z); 
                    this.scene.add(junction);

                    const isTop = (row > 0 && this.mapData[row-1][col] !== 67);
                    const isBottom = (row < this.mapRows - 1 && this.mapData[row+1][col] !== 67);
                    const isLeft = (col > 0 && this.mapData[row][col-1] !== 67);
                    const isRight = (col < this.mapCols - 1 && this.mapData[row][col+1] !== 67);

                    if (isTop && isLeft) this.createTrafficLight(x, z, 0); 
                    else if (isTop && isRight) this.createTrafficLight(x, z, Math.PI / 2); 
                    else if (isBottom && isLeft) this.createTrafficLight(x, z, -Math.PI / 2);
                    else if (isBottom && isRight) this.createTrafficLight(x, z, Math.PI);
                } 
                else if (val === 50 || val === 51) {
                    const goalGeo = new THREE.PlaneGeometry(this.cellSize, this.cellSize);
                    const goalMat = new THREE.MeshStandardMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.4 });
                    const goalMarker = new THREE.Mesh(goalGeo, goalMat);
                    goalMarker.rotation.x = -Math.PI / 2;
                    goalMarker.position.set(x, 0.02, z);
                    this.scene.add(goalMarker);
                } 
                else {
                    const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
                    sidewalk.position.set(x, 0.25, z);
                    this.scene.add(sidewalk);

                    if (this.modelCache.has(val)) {
                        const model = this.modelCache.get(val).clone();
                        model.traverse(n => { if (n.isMesh && n.material) n.material = n.material.clone(); });
                        model.position.set(x, 0.5, z);
                        this.scene.add(model);

                        if (val === 8) this.trafficLights.push(model); 
                        if ([5, 6, 4, 10].includes(val) && row > 0 && row < this.mapRows - 1) {
                            this.buildingsData.push({ row, col, mesh: model, x, z });
                        }
                    } else if (val !== 0) {
                        const bHeight = 20;
                        const bGeo = new THREE.BoxGeometry(this.cellSize - 2, bHeight, this.cellSize - 2);
                        const building = new THREE.Mesh(bGeo, new THREE.MeshStandardMaterial({ color: 0x7f8c8d }));
                        building.position.set(x, bHeight / 2 + 0.5, z); 
                        this.scene.add(building);
                        
                        if (row > 0 && row < this.mapRows - 1) {
                            this.buildingsData.push({ row, col, mesh: building, x, z });
                        }
                    }
                }
            }
        }
    }

    getTileAt(x, z) {
        const col = Math.floor((x - this.offsetX) / this.cellSize);
        const row = Math.floor((z - this.offsetZ) / this.cellSize);
        if (row < 0 || row >= this.mapRows || col < 0 || col >= this.mapCols) return null;
        return { row, col, val: this.mapData[row][col] };
    }

    pickNewTarget(currentTarget) {
        if (currentTarget) {
            currentTarget.mesh.traverse(n => { if(n.isMesh && n.userData.oldCol) n.material.color.setHex(n.userData.oldCol); });
        }
        const randIdx = Math.floor(Math.random() * this.buildingsData.length);
        const newTarget = this.buildingsData[randIdx];
        newTarget.mesh.traverse(n => { 
            if(n.isMesh) {
                if(!n.userData.oldCol) n.userData.oldCol = n.material.color.getHex();
                n.material.color.setHex(0xff0000); 
            }
        });
        this.targetBuilding = newTarget;
        return newTarget;
    }
    getFixedTarget() {
        if (!this.targetBuilding) return null;

        const target = this.targetBuilding;

        target.mesh.traverse(n => {
            if (n.isMesh) {
                if (!n.userData.oldCol) {
                    n.userData.oldCol = n.material.color.getHex();
                }
                n.material.color.setHex(0xff0000);
            }
        });

        return target;
    }
    startTargetBlink() {
        setInterval(() => {
            if (this.targetBuilding) {
                this.targetBuilding.mesh.traverse(n => {
                    if (n.material && n.material.emissive) {
                        n.material.emissiveIntensity =
                            n.material.emissiveIntensity === 1 ? 0.2 : 1;
                    }
                });
            }
        }, 500);
    }

    startTrafficLights() {
        const states = [
            { status: "GREEN", time: 10000, color: 0x00ff00 },
            { status: "YELLOW", time: 3000, color: 0xffff00 },
            { status: "RED", time: 10000, color: 0xff0000 }
        ];
        
        let currentIndex = 0;

        const updateState = () => {
            const currentState = states[currentIndex];
            this.trafficLightStatus = currentState.status;

            this.trafficLights.forEach(lightGroup => {
                const bulbs = lightGroup.userData.bulbs;
                
                // Tắt tất cả các đèn (giảm độ sáng)
                bulbs.RED.material.opacity = 0.2;
                bulbs.YELLOW.material.opacity = 0.2;
                bulbs.GREEN.material.opacity = 0.2;

                // Bật đèn tương ứng (sáng rực)
                const activeBulb = bulbs[currentState.status];
                activeBulb.material.opacity = 1.0;
            });

            // Chuyển sang trạng thái tiếp theo
            currentIndex = (currentIndex + 1) % states.length;
            
            // Đặt lịch cho lần đổi đèn tới
            setTimeout(updateState, currentState.time);
        };

        updateState(); // Khởi động chu kỳ đầu tiên
    }

    createTrafficLight(x, z, rotationY = 0) {
        const group = new THREE.Group();
        
        // Cột đèn
        const pole = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 7, 8),
            new THREE.MeshStandardMaterial({ color: 0x2c3e50 })
        );
        pole.position.y = 3.5;
        group.add(pole);

        // Hộp chứa đèn (Làm dài hơn để chứa 3 đèn)
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(1.2, 3.5, 1.2),
            new THREE.MeshStandardMaterial({ color: 0x000000 })
        );
        box.position.y = 7;
        group.add(box);

        // Gán góc xoay cho cả Group đèn
        group.rotation.y = rotationY;

        // Hàm tạo bóng đèn nhỏ
        const createBulb = (y, color) => {
            const bulb = new THREE.Mesh(
                new THREE.SphereGeometry(0.4, 16, 16),
                new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.2 }) // Mặc định tắt (mờ)
            );
            bulb.position.set(0, y, 0.6);
            return bulb;
        };

        // Tạo 3 bóng đèn: Đỏ (trên), Vàng (giữa), Xanh (dưới)
        const redBulb = createBulb(8.0, 0xff0000);
        const yellowBulb = createBulb(7.0, 0xffff00);
        const greenBulb = createBulb(6.0, 0x00ff00);

        // Lưu vào userData để dễ điều khiển
        group.userData.bulbs = {
            RED: redBulb,
            YELLOW: yellowBulb,
            GREEN: greenBulb
        };

        group.add(redBulb, yellowBulb, greenBulb);
        group.position.set(x, 0, z);
        this.scene.add(group);
        this.trafficLights.push(group);
        
    }

}