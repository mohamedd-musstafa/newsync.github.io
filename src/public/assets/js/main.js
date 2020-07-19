// General
function updateUIWhenAuthChange(provider, isLoggedIn) {
  if (isLoggedIn) {
    $(`#connect-${provider} .status`).text("Status: Connected");
    toggleClickIndex[provider] = 1;
  } else {
    $(`#connect-${provider} .status`).text("Status: Not Connected");
    toggleClickIndex[provider] = 0;
  }
}

// General

// Google

async function googleDownload(url) {
  try {
    window.open(url);
  } catch (e) {
    console.error(e);
  }
}

async function googleDelete(id) {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
      method: "DELETE",
      headers: new Headers({
        Authorization: `Bearer ${gapi.client.getToken().access_token}`,
      }),
    });

    console.log(res);

    window.location.reload();
  } catch (e) {
    console.error(e);
  }
}

async function listGoogleFiles() {
  const {
    result: { files },
  } = await gapi.client.drive.files.list({
    pageSize: 10,
    fields: "nextPageToken, files(id, name, webContentLink)",
  });

  let content = "";
  files.forEach(({ id, name, webContentLink }) => {
    content += `<tr>
      <td>${name}</td>
      <td>Google</td>
      <td>
        <button class="btn btn-danger btn-icon-split" onclick="googleDelete('${id}')">
          <span class="icon text-white-50">
            <i class="fas fa-trash"></i>
          </span>
          <span class="text">Delete</span>
        </button>
        <button class="btn btn-success btn-icon-split" onclick="googleDownload('${webContentLink}')">
          <span class="icon text-white-50">
            <i class="fas fa-download"></i>
          </span>
          <span class="text">Download</span>
        </button>
      </td>
    </tr>`;
  });

  $("#file-content").append(content);
}

function getGoogleAuthStatus(isLoggedIn) {
  updateUIWhenAuthChange("google", isLoggedIn);
  if (isLoggedIn) {
    listGoogleFiles();
  }
}

function handleGoogleClientLoad() {
  gapi.load("client:auth2", async () => {
    await window.gapi.client.init({
      apiKey: "AIzaSyD_gNp3AUgJsj0_5ughmUcMfYTVmRROK7Y",
      clientId:
        "288594933692-bl6293o1ejf3feosb1por8hslt4qfnjo.apps.googleusercontent.com",
      discoveryDocs: [
        "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
      ],
      scope: "https://www.googleapis.com/auth/drive",
    });

    gapi.auth2.getAuthInstance().isSignedIn.listen(getGoogleAuthStatus);
    getGoogleAuthStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
  });
}

// Google

// Dropbox

async function dropboxDownload(path) {
  try {
    const dbx = new Dropbox.Dropbox({
      accessToken: Cookies.get("dropboxToken"),
    });

    const { fileBlob } = await dbx.filesDownload({ path });
    saveAs(fileBlob, path);
  } catch (e) {
    console.error(e);
  }
}

async function dropboxDelete(path) {
  try {
    const dbx = new Dropbox.Dropbox({
      accessToken: Cookies.get("dropboxToken"),
    });

    await dbx.filesDelete({ path });

    window.location.reload();
  } catch (e) {
    console.error(e);
  }
}

function getAccessTokenFromUrl(hash) {
  return utils.parseQueryString(hash).access_token;
}

async function listDropboxFiles() {
  const dbx = new Dropbox.Dropbox({ accessToken: Cookies.get("dropboxToken") });
  const { entries } = await dbx.filesListFolder({ path: "" });

  let content = "";
  entries
    .filter((o) => o[".tag"] === "file")
    .forEach(({ path_display }) => {
      content += `<tr>
      <td>${path_display}</td>
      <td>Dropbox</td>
      <td>
        <button class="btn btn-danger btn-icon-split" onclick="dropboxDelete('${path_display}')">
          <span class="icon text-white-50">
            <i class="fas fa-trash"></i>
          </span>
          <span class="text">Delete</span>
        </button>
        <button class="btn btn-success btn-icon-split" onclick="dropboxDownload('${path_display}')">
          <span class="icon text-white-50">
            <i class="fas fa-download"></i>
          </span>
          <span class="text">Download</span>
        </button>
      </td>
    </tr>`;
    });

  $("#file-content").append(content);
}

function getDropboxAuthStatus(isLoggedIn) {
  updateUIWhenAuthChange("dropbox", isLoggedIn);
  if (isLoggedIn) {
    listDropboxFiles();
  }
}

function handleDropboxClientLoad() {
  const token = Cookies.get("dropboxToken");

  if (token && token !== "") {
    return getDropboxAuthStatus(true);
  }
  return getDropboxAuthStatus(false);
}

// Dropbox

$(document).ready(() => {
  // Google

  $("#connect-google").toggleClick("google")(
    () => {
      gapi.auth2.getAuthInstance().signIn();
    },
    () => {
      gapi.auth2.getAuthInstance().signOut();
    }
  );

  $("#google-drive-upload").on("change", async function () {
    try {
      const file = $(this).prop("files")[0];

      const res = await gapi.client.drive.files.create({
        "content-type": "application/json",
        uploadType: "multipart",
        name: file.name,
        mimeType: file.type,
        fields: "id, name, kind, size",
      });

      await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${res.result.id}`,
        {
          method: "PATCH",
          headers: new Headers({
            Authorization: `Bearer ${gapi.client.getToken().access_token}`,
            "Content-Type": file.type,
          }),
          body: file,
        }
      );

      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  });

  // Google

  // Dropbox
  handleDropboxClientLoad();

  $("#connect-dropbox").toggleClick("dropbox")(
    () => {
      const dbx = new Dropbox.Dropbox({ clientId: "3dbrcvorsxb25sh" });
      const authUrl = dbx.getAuthenticationUrl("http://localhost:3000");
      const authFlow = popup(authUrl);

      const checkAuth = setInterval(() => {
        const token = getAccessTokenFromUrl(authFlow.location.hash);

        if (token) {
          Cookies.set("dropboxToken", token, { expires: 1 });
          handleDropboxClientLoad();
          authFlow.close();
          clearInterval(checkAuth);
        }
      }, 1000);
    },
    () => {
      Cookies.remove("dropboxToken");
      handleDropboxClientLoad();
    }
  );

  $("#dropbox-upload").on("change", async function () {
    try {
      const file = $(this).prop("files")[0];

      const dbx = new Dropbox.Dropbox({
        accessToken: Cookies.get("dropboxToken"),
      });
      await dbx.filesUpload({ path: `/${file.name}`, contents: file });

      window.location.reload();
    } catch (e) {
      console.error(e);
    }
  });
});

// General
