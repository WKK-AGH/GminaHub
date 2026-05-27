@echo off
for %%b in (backend database feature frontend main) do (
  git checkout %%b
  git merge main
  git push origin %%b
)
