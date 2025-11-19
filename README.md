# C&S Project 2025 - Team-r

## Introction

This repository is a collection of prerequisites and guidance for team project activities.

## Directory Structure

This project

```
    /docs/
    /Dockerfile  # or, /Containerfile
    /README.md
    /Usage.md
    /backend/ # backend server
    /configs/ # configurations
    /datasets/ # original & preprocessed data
    /ml/ # ML Pipeline
    /frontend/ # frontend app
```

## Installation

```bash
docker compose -f docker-compose-local.yml up --build
```

## How to use

## Guidelines

Team members are responsible for taking on tasks appropriate to their roles and submitting them periodically to the appropriate repositories. At this time, please be aware of the following precautions.

- Prohibition of account sharing: The act of pushing someone else's work to your ID is prohibited. **You can only upload your own results with your GitHub account.**
- Periodic upload recommended: Even if the results such as code are incomplete, **please continue to push the progress so that other team members and evaluators can observe and give feedback.** The act of pushing completed results at once is recognized only as a contribution for that date, and efforts in the process are difficult to be recognized.
- Documentation recommended: Documentation in the `docs` directory provided by default will be credited to the author. In addition, even if presentation materials such as PPT are uploaded in binary format, if the contents are listed in the `docs` directory, contributions can be recognized by quoting them.
- Create a `Dockerfile (Containerfile)`: Project artifacts should be able to be packaged into one (or more) container image with the following command: `docker build --tag cs-project-2025-team-xxx .`
  - Build arguments and environment variable dependencies should not be present.
  - **Execution: Execution and usage for containerized images must be documented in `Usage.md` file.**

## Q&A

Please use the `Issues` function to raise inquiries.
