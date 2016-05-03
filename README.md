# Issues-Management
List the issues in your repository by you description.

## Quick start

1. Install from npm

   ```
   cd /Issues-Management/
   npm install 
   ```

2. Add config.json, if you are a Enterprise user

   ```
   echo "{
      "apiurl":"api.github.com"
   }" > config.json
   ```
   
   if you should use a GitHub Enterprise instance

   ```
   {
      "apiurl":"mydomain.com/api/v3"
   }
   ```

3. Start Server

   ```
   cd /Issues-Management/bin
   node www 
   ```

4. Open the browser

   ```
   input localhost:3000
   ```