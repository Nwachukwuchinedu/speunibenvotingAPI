import { exec } from "child_process";

const autoCommitAndPush = (filePath) => {
 exec(`git add ${filePath}`, (err, stdout, stderr) => {
   if (err) {
     console.error("Error in `git add`:", stderr);
     return;
   }
   console.log("File added to Git:", stdout);

   exec(
     `git commit -m "Add uploaded file: ${filePath}"`,
     (err, stdout, stderr) => {
       if (err) {
         console.error("Error in `git commit`:", stderr);
         return;
       }
       console.log("File committed to Git:", stdout);

       exec(`git push`, (err, stdout, stderr) => {
         if (err) {
           console.error("Error in `git push`:", stderr);
           return;
         }
         console.log("File pushed to GitHub:", stdout);
       });
     }
   );
 });

};

export default autoCommitAndPush;
