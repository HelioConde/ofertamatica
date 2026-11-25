module.exports = {
 name:'Validade Zero Camera',slug:'validade-zero-camera',version:'1.0.0',
 platforms:['web'],web:{bundler:'metro',output:'single'},
 experiments:{baseUrl:process.env.VZ_CAMERA_BASE || '/validade-zero/static/expo-camera'}
};
