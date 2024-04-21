/**
 * Vis 1 Task 1 Framework
 * Copyright (C) TU Wien
 *   Institute of Visual Computing and Human-Centered Technology
 *   Research Unit of Computer Graphics
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are not permitted.
 *
 * Shader parent class. Loads .essl files from the folder shaders. Provides methods to set uniforms.
 * The function load() has to be explicitly called from an async function!
 *
 * @author Manuela Waldner
 */
class Shader {
    constructor(vertexProgram, fragmentProgram) {
        this.vertexProgram = vertexProgram;
        this.fragmentProgram = fragmentProgram;
        this.material = new THREE.ShaderMaterial
        ({
            uniforms: {},
            transparent: true
        });
    }

    async #loadShader(shader, name){
        const program = await d3.text("shaders/"+name+".essl");
        this.material[shader] = program;
    }

    // this function has to be explicitly called after the constructor from another async function like that:
    // await yourShader.load();
    async load(){
        await this.#loadShader("vertexShader", this.vertexProgram);
        await this.#loadShader("fragmentShader", this.fragmentProgram);
    }

    // use the type parameter for array variants that are not supported by THREE.Uniform yet:
    // e.g., v2v (array of THREE.Vector2), v3v (array of THREE.Vector3) etc.
    // otherwise only set key and value
    setUniform(key, value, type){
        if(typeof type !== 'undefined'){
            this.material.uniforms[key] = {
                'type': type,
                'value': value
            };
        }
        else{
            this.material.uniforms[key] = new THREE.Uniform(value);
        }
    }

    setShaderColors(pinPoints) {
        // SAMPLE CODE FOR FHC
        const arrayLength = 10;

        // Initialize shaderColors array with zero vectors
        let shaderColors = Array.from({ length: arrayLength }, () => new THREE.Vector3(0, 0, 0));

        // Initialize shaderColorsIndex array with zero vectors
        let shaderColorsIndex = Array.from({ length: arrayLength }, () => new THREE.Vector2(0, 0));

        for (let i = 0; i < pinPoints.length; i++) {
            // Set shaderColorsIndex to x and y values of pinPoints
            shaderColorsIndex[i] = new THREE.Vector2(pinPoints[i].density, pinPoints[i].intensity);

            // Set shaderColors to color values of pinPoints
            let c = d3.color(pinPoints[i].color);
            shaderColors[i] = new THREE.Vector3(c.r / 255.0, c.g / 255.0, c.b / 255.0);
        }

        shader.setUniform('shaderColorsLength', shaderColors.length);
        shader.setUniform('shaderColorsIndex', shaderColorsIndex);
        shader.setUniform('shaderColors', shaderColors);
    }
}