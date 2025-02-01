// Fetch videos
async function fetchVideos(query = '') {
    try {
      const response = await fetch(`https://egyptianmemehub-backend.onrender.com/videos?q=${query}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const backendUrl = 'https://egyptianmemehub-backend.vercel.app/';
      const videos = await response.json();
      displayVideos(videos);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  }
  
  // Upload video
  function uploadVideo(file) {
    const formData = new FormData();
    formData.append('video', file);
    fetch('https://egyptianmemehub-backend.onrender.com/upload', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + token,
      },
      body: formData,
    })
      .then(response => response.text())
      .then(data => {
        console.log('Video uploaded successfully:', data);
        fetchVideos();
      })
      .catch(error => {
        console.error('Error uploading video:', error);
      });
    }
    document.addEventListener('DOMContentLoaded', function () {
        const player = videojs('main-video', {
          controlBar: {
            children: [
              'playToggle',
              'volumePanel',
              'currentTimeDisplay',
              'timeDivider',
              'durationDisplay',
              'remainingTimeDisplay',
              'progressControl',
              'playbackRateMenuButton',
              'fullscreenToggle',
              'subtitlesButton',
            ],
          },
        });
        const backendUrl = 'https://egyptianmemehub-backend.onrender.com';
        const urlParams = new URLSearchParams(window.location.search);
        const filename = urlParams.get('filename');
      
        if (filename) {
          player.src({ type: 'video/mp4', src: `https://egyptianmemehub-backend.onrender.com/uploads/${filename}` });
          document.getElementById('video-title').textContent = filename.replace('.mp4', '');
        }
      
        const relatedVideosContainer = document.getElementById('related-videos');
        if (filename && relatedVideosContainer) {
          fetch('https://egyptianmemehub-backend.onrender.com/videos')
            .then(response => response.json())
            .then(videos => {
              displayRelatedVideos(videos, filename);
            })
            .catch(error => {
              console.error('Error fetching related videos:', error);
            });
        }
      
        function displayRelatedVideos(videos, currentFilename) {
          relatedVideosContainer.innerHTML = '<h3>Related Videos</h3>';
          videos.forEach(video => {
            if (video.filename !== currentFilename) {
              const videoElement = document.createElement('div');
              videoElement.classList.add('related-video');
              videoElement.innerHTML = `
                <a href="/video.html?filename=${video.filename}">
                  <video src="${video.url}" width="100%"></video>
                  <h3>${video.filename.replace('.mp4', '')}</h3>
                </a>
              `;
              const videoTag = videoElement.querySelector('video');
              videoTag.addEventListener('contextmenu', e => e.preventDefault());
              videoTag.addEventListener('play', e => e.target.pause());
              relatedVideosContainer.appendChild(videoElement);
            }
          });
        }
      });
    document.addEventListener("DOMContentLoaded",function(){const loginButton=document.getElementById("login-button");const logoutButton=document.getElementById("logout-button");const uploadInput=document.getElementById("upload-input");const searchBar=document.getElementById("search-bar");const videoGallery=document.getElementById("video-gallery");const token=localStorage.getItem('authToken');const videoTitle=document.getElementById("video-title");const descriptionText=document.getElementById("description-text");const player=videojs('main-video',{controlBar:{children:['playToggle','volumePanel','currentTimeDisplay','timeDivider','durationDisplay','remainingTimeDisplay','progressControl','playbackRateMenuButton','fullscreenToggle','subtitlesButton']}});if(token){loginButton.style.display='none';logoutButton.style.display='block'}else{loginButton.style.display='block';logoutButton.style.display='none'}
loginButton.addEventListener("click",function(){window.location.href='login.html'});logoutButton.addEventListener("click",function(){localStorage.removeItem('authToken');window.location.href='login.html'});uploadInput.addEventListener("change",function(event){const files=event.target.files;for(let i=0;i<files.length;i++){uploadVideo(files[i])}});searchBar.addEventListener("input",function(){const query=this.value.toLowerCase();fetchVideos(query)});function uploadVideo(file){const formData=new FormData();formData.append("video",file);fetch('/upload',{method:'POST',headers:{'Authorization':'Bearer '+token},body:formData}).then(response=>response.text()).then(data=>{console.log('Video uploaded successfully:',data);fetchVideos()}).catch(error=>{console.error('Error uploading video:',error)})}
function fetchVideos(query=''){fetch('/videos').then(response=>response.json()).then(videos=>{if(query){videos=videos.filter(video=>video.filename.toLowerCase().includes(query))}
displayVideos(videos)}).catch(error=>{console.error('Error fetching videos:',error)})}
function displayVideos(videos){videoGallery.innerHTML="";videos.forEach(video=>{const videoElement=document.createElement("div");videoElement.classList.add("video-thumbnail");videoElement.innerHTML=`
                <a href="/video.html?filename=${video.filename}">
                    <video src="${video.url}" width="300"></video>
                    <h3>${video.filename.replace('.mp4', '')}</h3>
                </a>
            `;videoGallery.appendChild(videoElement)})}
fetchVideos();const urlParams=new URLSearchParams(window.location.search);const filename=urlParams.get('filename');if(filename){player.src({type:'video/mp4',src:`/uploads/${filename}`});fetch(`/title/${filename}`).then(response=>response.json()).then(data=>{videoTitle.textContent=data.title||filename.replace('.mp4','')}).catch(error=>{console.error('Error fetching title:',error)});fetch(`/description/${filename}`).then(response=>response.json()).then(data=>{descriptionText.textContent=data.description}).catch(error=>{console.error('Error fetching description:',error)})}
player.ready(function(){this.hotkeys({volumeStep:0.1,seekStep:5,enableModifiersForNumbers:!1})});player.on('contextmenu',function(event){event.preventDefault();alert('Direct video saving is disabled. Please use the provided download button.')});const playbackSpeedSelector=document.getElementById("playback-speed-selector");playbackSpeedSelector.addEventListener("change",function(){player.playbackRate(parseFloat(this.value))});logoutButton.addEventListener("click",function(){localStorage.removeItem('authToken');sessionStorage.removeItem('authToken');window.location.href='login.html'});const downloadButton=document.getElementById("download-button");downloadButton.addEventListener("click",function(){window.location.href=`/downloads/${filename}`});fetchComments(filename);function fetchComments(videoFilename){fetch(`/comments/${videoFilename}`).then(response=>response.json()).then(comments=>{displayComments(comments)}).catch(error=>{console.error('Error fetching comments:',error)})}
function postComment(videoFilename,comment){fetch('/comments',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({videoFilename,comment})}).then(response=>response.json()).then(()=>{const commentText=document.getElementById("comment-text");commentText.value='';fetchComments(videoFilename)}).catch(error=>{console.error('Error posting comment:',error)})}
const commentForm=document.getElementById("comment-form");commentForm.addEventListener("submit",function(event){event.preventDefault();const commentText=document.getElementById("comment-text").value.trim();if(commentText){postComment(filename,commentText)}});function displayComments(comments){const commentsList=document.getElementById("comments-list");commentsList.innerHTML="";comments.forEach(comment=>{const commentElement=document.createElement("div");commentElement.classList.add("comment");commentElement.innerHTML=`
                <p><strong>${comment.username}</strong> ${comment.comment}</p>
                <small>${new Date(comment.timestamp).toLocaleString()}</small>
                <div class="comment-options">
                    <button class="options-button">...</button>
                    <div class="options-menu" style="display: none;">
                        <button class="edit-comment-button">Edit</button>
                        <button class="delete-comment-button">Delete</button>
                    </div>
                </div>
            `;commentsList.appendChild(commentElement);const optionsButton=commentElement.querySelector(".options-button");const optionsMenu=commentElement.querySelector(".options-menu");optionsButton.addEventListener("click",function(){optionsMenu.style.display=optionsMenu.style.display==="none"?"block":"none"});const editCommentButton=commentElement.querySelector(".edit-comment-button");const deleteCommentButton=commentElement.querySelector(".delete-comment-button");editCommentButton.addEventListener("click",function(){const commentTextElement=commentElement.querySelector("p strong + text");const newComment=prompt("Edit your comment:",commentTextElement.textContent);if(newComment!==null){updateComment(comment._id,newComment)}});deleteCommentButton.addEventListener("click",function(){if(confirm("Are you sure you want to delete this comment?")){deleteComment(comment._id)}})})}
function updateComment(commentId,newComment){fetch(`/comments/${commentId}`,{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},body:JSON.stringify({comment:newComment})}).then(response=>response.json()).then(()=>{fetchComments(filename)}).catch(error=>{console.error('Error updating comment:',error)})}
function deleteComment(commentId){fetch(`/comments/${commentId}`,{method:'DELETE',headers:{'Authorization':'Bearer '+token}}).then(()=>{fetchComments(filename)}).catch(error=>{console.error('Error deleting comment:',error)})}
function displayRelatedVideos(videos,currentFilename){const relatedVideos=document.getElementById("related-videos");relatedVideos.innerHTML="";videos.forEach(video=>{if(video.filename!==currentFilename){const videoElement=document.createElement("div");videoElement.classList.add("video-thumbnail");videoElement.innerHTML=`
                    <a href="/video.html?filename=${video.filename}">
                        <video src="${video.url}" width="300"></video>
                        <h3>${video.filename.replace('.mp4', '')}</h3>
                    </a>
                `;relatedVideos.appendChild(videoElement)}})}
fetch('/videos').then(response=>response.json()).then(videos=>{displayRelatedVideos(videos,filename)}).catch(error=>{console.error('Error fetching videos:',error)})})