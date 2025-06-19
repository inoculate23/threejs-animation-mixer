# Custom Threejs-animation-mixer
Custom Boilerplate that builds in a player for embedded animations ie: Sketchfab models
 It's been a long struggle for me to figure out how to make the embedded animations in Sketchfab GLTF and GLB models to play after  exporting them from the ThreeJS editor.

# What and why?
 This script replaces the standard app.js script exported by the editor, just rename or delete that one and copy this into the js folder.

 # Current Limitations:
 I've only set it to play the first animation in each moodel. You can customize this by adding a loop function or parse to cionsole and call the id's or names in the mixer according to your scene.
