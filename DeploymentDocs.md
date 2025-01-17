# **Backend Deployment Documentation**

This document outlines the **backend deployment process** for the **Swapup Node App**. It will guide you through the necessary steps to deploy the backend code to Azure Web App for **development** and **production** environments using GitHub Actions.

### **📜 Overview**

The backend app is deployed to **Azure Web App** using the **GitHub Actions pipeline**. The pipeline automates the process, building the backend code fresh every time the code is pushed to the `deploy` (development) or `deploy-prod` (production) branches. The process eliminates the need for manually building the app and ensures the app is always up-to-date.

### **📥 Pre-Deployment Requirements**

Before deployment, make sure you have the following:

* **GitHub Access**: Ensure you have access to the backend repository and the `deploy`/`deploy-prod` branches.  
* **Azure Web App**: Ensure your Azure Web App service is set up and configured to deploy the backend app.  
* **Node.js**: The backend requires Node.js (version `20.x` or latest stable version).

## **Branches Overview**

1. **`main` Branch**  
   * 📂 Contains the latest working code and serves as the base for other deployment branches.  
2. **`deploy` Branch**  
   * 🚀 Used for deploying the application to the **development environment**.  
   * 📜 Contains the `dev` workflow file.  
3. **`deploy-prod` Branch**  
   * 🌟 Used for deploying the application to the **production environment**.  
   * 📜 Contains the `prod` workflow file.

**Important:**  
⚠️ Avoid making direct changes in the `deploy` or `deploy-prod` branches.  
🔄 Always use the `main` branch for updates and follow the outlined deployment process.

## **Deployment Steps for Development Environment**

### **Step-by-Step Guide**

1. **🔀 Checkout to the `deploy` Branch**  
   * Switch to the `deploy` branch on your local machine:

| git checkout deploy |
| :---- |

2. **📥 Pull Latest Changes from `main`**  
   * Merge the latest code from the `main` branch into the `deploy` branch:

| git pull origin main |
| :---- |

3. **🔧 Set Environment Variables**  
   * Update the `.env` file:  
     1. Set `SWAPUP_ENVIRONMENT_KEY` to `"development"`.  
     2. ✅ Verify that all environment variables prefixed with `DEVELOPMENT_` are correctly configured.  
4. **💻 Testing Locally (Optional but Recommended)**  
   * Before pushing changes to the deployment branch, you can test the backend locally using `npm start`. This ensures that the code is working as expected before deployment.  
     1. **Install Dependencies**:

| npm install |
| :---- |

     2. **Start the Backend Locally**:

| npm start |
| :---- |

     3. **Verify Local Changes**:   
        Make sure everything is functioning properly before pushing to the deployment branch.  
5. **📤 Push Changes to the `deploy` Branch**

If everything looks fine, push the code to the `deploy` branch:

| git add .git commit \-m "Deploy: \<your message\>" |
| :---- |

* git push origin deploy  
  * This will trigger the deployment pipeline for the **development environment**.

### **🛠️ Create Fresh Build (No Local Build Push)**

### Unlike the frontend, the backend doesn't require you to create a local build before pushing changes. The pipeline builds the app fresh every time it is deployed from the `deploy` or `deploy-prod` branch.

### **❌ DON’Ts for Development Deployment**

* **⛔ Do not** make direct changes in the `deploy` branch.  
* **⛔ Do not** merge the `deploy` branch back into the `main` branch.  
  * The `deploy` branch contains the `github workflow` directory, which is used for deployment through the pipeline. Merging it into `main` can cause conflicts.

## **Deployment Steps for Production Environment**

### **Step-by-Step Guide**

1. **🔀 Checkout to the `deploy-prod` Branch**  
   * Switch to the **`deploy-prod`** branch on your local machine:

| git checkout deploy-prod |
| :---- |

2. **📥 Pull Latest Changes from `main`**  
   * Merge the latest code from the `main` branch into the **`deploy-prod`** branch:

| git pull origin main |
| :---- |

3. **🔧 Set Environment Variables**  
   * Update the `.env` file:  
     * Set `SWAPUP_ENVIRONMENT_KEY` to `"production"`.  
     * ✅ Verify that all environment variables prefixed with `PRODUCTION_` are correctly configured.  
4. **💻 Testing Locally (Optional but Recommended)**  
   * Before pushing changes to the deployment branch, you can test the backend locally using `npm start`. This ensures that the code is working as expected before deployment.  
     * **Install Dependencies**:

| npm install |
| :---- |

     * **Start the Backend Locally**:

| npm start |
| :---- |

     * **Verify Local Changes**:   
       Make sure everything is functioning properly before pushing to the deployment branch.  
5. **📤 Push Changes to the `deploy-prod` Branch**

If everything looks fine, push the code to the **`deploy-prod`** branch:

| git add .git commit \-m "Deploy-Prod: \<your message\>" |
| :---- |

* git push origin deploy  
  * This will trigger the deployment pipeline for the **production environment**.

### **🛠️ Create Fresh Build (No Local Build Push)**

### Unlike the frontend, the backend doesn't require you to create a local build before pushing changes. The pipeline builds the app fresh every time it is deployed from the `deploy` or `deploy-prod` branch.

### **❌ DON’Ts for Production Deployment**

* **⛔ Do not** make direct changes in the `deploy-prod` branch.  
* **⛔ Do not** merge the `deploy-prod` branch back into the `main` branch.  
  * The `deploy-prod` branch contains the `github workflow` directory, which is used for deployment through the pipeline. Merging it into `main` can cause conflicts.

## 

## **General Best Practices**

* 🛠️ Always start from the `dev` branch for code changes.  
* ✍️ Use meaningful commit messages for easier tracking.  
* 🔒 Verify all environment variables before creating a new build.  
* 🧪 Test the build locally before pushing to any deployment branch.  
* 📝 Follow the commit message conventions:  
  * **Development:** `Deploy: <your message>`  
  * **Production:** `Deploy-Prod: <your message>`

# **🚀 Deployment Pipeline for Backend🌐**

This documentation explains the GitHub Actions workflow and deployment pipeline for deploying the **Swapup Backend Node.js API** to Azure Web App. It covers all the steps involved in building the app locally, preparing it for deployment, and ensuring smooth deployment to Azure.

## **📜 Overview of the Workflow**

The workflow is triggered on a push to the `deploy` branch or manually via `workflow_dispatch`. The pipeline consists of two main jobs:

1. **Build**: Prepare and package the backend API.  
2. **Deploy**: Deploy the API to Azure Web App.

## **🛠️ Build Job**

The **Build Job** is responsible for preparing the backend API, including installing dependencies, packaging the API, and creating an artifact for deployment.

### **Steps in the Build Job**

**Checkout the Code 💻**  
The code is checked out from the repository.

| \- uses: actions/checkout@v4 |
| :---- |

1. **Set up Node.js ⚙️**  
   Installs Node.js using version `20.x`.

| \- name: Set up Node.js version  uses: actions/setup-node@v3  with:    node\-version: '20.x' |
| :---- |

2. **Install Dependencies and Build 🔧**  
   Installs all dependencies defined in `package.json`, then builds the app if a build script is available (`npm run build`).

| \- name: Install dependencies and build  run: |    npm install    npm run build \--if\-present |
| :---- |

3. **Zip the Build Artifact 📦**  
   Creates a zip file (`release.zip`) containing the build output (`./dist`), along with essential files like `package.json`, `package-lock.json`, and `node_modules`. This zip file will be used in the deployment job.

| \- name: Zip artifact for deployment  run: zip \-r release.zip ./dist package.json package-lock.json node\_modules |
| :---- |

4. **Upload Artifact for Deployment 📤**  
   Uploads the zipped artifact so that the next deployment job can use it.

| \- name: Upload artifact for deployment job  uses: actions/upload-artifact@v4  with:    name: node-app    path: release.zip |
| :---- |

## 

## **🚀 Deploy Job**

The **Deploy Job** is responsible for deploying the pre-built backend API to Azure Web App.

### **Steps in the Deploy Job**

**Download Artifact from Build Job 📥**  
Downloads the artifact (`node-app`) from the build job to be used in the deployment.

| \- name: Download artifact from build job  uses: actions/download-artifact@v4  with:    name: node-app |
| :---- |

1. **Login to Azure 🔐**  
   Logs into Azure using service principal credentials stored in GitHub Secrets.

| \- name: Login to Azure  uses: azure/login@v2  with:    client-id: ${{ secrets.AZUREAPPSERVICE\_CLIENTID\_F0FDFA600A834416AFE7A433C62E87DF }}    tenant-id: ${{ secrets.AZUREAPPSERVICE\_TENANTID\_1F27C71DFFA8482EA586FDC895AED015 }}    subscription-id: ${{ secrets.AZUREAPPSERVICE\_SUBSCRIPTIONID\_3BA5770DFDE949ABAAE12A8E4D9218D5 }} |
| :---- |

2. **Wait for 5 Seconds ⏳**  
   Adds a small delay to ensure that resources are ready for deployment.

| \- name: Wait for 5 seconds  run: sleep 5 |
| :---- |

3. **Deploy to Azure Web App 🌐**  
   Deploys the zip file (`release.zip`) to the Azure Web App `swapup-api-dev`.

| \- name: 'Deploy to Azure Web App'  uses: azure/webapps-deploy@v3  with:    app-name: 'swapup-api-dev'    package: release.zip |
| :---- |

   

## **🛠️ .deployment File Configuration**

The `.deployment` file is used to configure Azure App Service deployment options. It contains the following configuration:

| \[config\]SCM\_DO\_BUILD\_DURING\_DEPLOYMENT\=falseWEBSITE\_RUN\_FROM\_PACKAGE\=1 |
| :---- |

### **Key Settings:**

* **SCM\_DO\_BUILD\_DURING\_DEPLOYMENT=false**: Disables automatic build during deployment because the build is done beforehand locally.  
* **WEBSITE\_RUN\_FROM\_PACKAGE=1**: Tells Azure to run the app directly from the zipped package. This speeds up the deployment process by avoiding unnecessary build steps on Azure.

## **🌟 Why This Workflow?**

This workflow is designed with efficiency and control in mind:

* **Local Build**: We build the app locally to ensure environment variables are included during the build process, which is important for Node.js applications that require these values at runtime.  
* **Minimal Configuration**: The API is prepared and packaged ahead of time, reducing the complexity of the deployment process on Azure.  
* **Efficient Deployment**: By zipping and uploading the pre-built API, the deployment process becomes faster and more reliable.

## **⚙️ Conclusion**

This GitHub Actions pipeline automates the process of building and deploying your backend Node.js API to Azure Web App. By building the app locally, you ensure that environment variables are set properly during build time, and using zipped artifacts ensures a fast and efficient deployment process to Azure. 🌟

