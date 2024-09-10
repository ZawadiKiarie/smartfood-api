const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

const uploadImage = async(filePath) => {
  const formData = new FormData();
  formData.append('image', fs.createReadStream(filePath));

  try {
    const response = await axios.post('http://localhost:5000/segment', formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });
    console.log('Segmentation results:', response.data);
    return response.data;
  }catch(error){
    console.error('Error uploading image:', error.response ? error.response.data : error.message);
    throw error;
  }
      
}

module.exports = {
  uploadImage,
}



