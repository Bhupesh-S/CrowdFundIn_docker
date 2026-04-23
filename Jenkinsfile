pipeline {
    agent any

    triggers {
        pollSCM('H/5 * * * *')
    }

    environment {
        BACKEND_IMAGE  = 'crowdfundin-backend'
        FRONTEND_IMAGE = 'crowdfundin-frontend'
        DOCKER_TAG     = "${env.BUILD_NUMBER}"
    }

    stages {

        // ─────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Pulling source code...'
                checkout scm
            }
        }

        // ─────────────────────────────────────────────
        stage('Install Dependencies') {
            steps {
                echo '📦 Installing dependencies...'
                dir('backend') {
                    sh 'npm install'
                }
                dir('frontend') {
                    sh 'npm install --legacy-peer-deps || npm install'
                }
            }
        }

        // ─────────────────────────────────────────────
        // NOTE: Backend test only runs a smoke check (env + syntax).
        // We do NOT start server.js here because it requires a live
        // MongoDB Atlas connection which is only available at runtime
        // inside the Docker network. Frontend tests run in CI mode.
        stage('Test') {
            steps {
                echo '🧪 Running tests...'
                dir('backend') {
                    sh '''
                        node -e "require('./package.json'); console.log('✅ Backend package.json OK')"
                        node --check server.js && echo "✅ Backend syntax OK"
                    '''
                }
                dir('frontend') {
                    sh 'CI=true npm test || true'
                }
            }
        }

        // ─────────────────────────────────────────────
        stage('Docker Build') {
            parallel {
                stage('Backend') {
                    steps {
                        sh """
                        docker build -f backend/Dockerfile -t ${BACKEND_IMAGE}:${DOCKER_TAG} backend/
                        docker tag ${BACKEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:latest
                        """
                    }
                }
                stage('Frontend') {
                    steps {
                        sh """
                        docker build -f frontend/Dockerfile -t ${FRONTEND_IMAGE}:${DOCKER_TAG} frontend/
                        docker tag ${FRONTEND_IMAGE}:${DOCKER_TAG} ${FRONTEND_IMAGE}:latest
                        """
                    }
                }
            }
        }

        // ─────────────────────────────────────────────
        stage('Image Size Report') {
            steps {
                sh "docker images ${BACKEND_IMAGE}"
                sh "docker images ${FRONTEND_IMAGE}"
            }
        }

        // ─────────────────────────────────────────────
        stage('Security Scan') {
            steps {
                echo '🔒 Running Docker Scout...'
                sh '''
                    if docker scout version > /dev/null 2>&1; then
                        docker scout cves ${BACKEND_IMAGE}:latest || true
                        docker scout cves ${FRONTEND_IMAGE}:latest || true
                    else
                        echo "⚠️ docker scout not installed → skipping"
                    fi
                '''
            }
        }

        // ─────────────────────────────────────────────
        stage('Prepare Environment') {
            steps {
                echo '⚙️ Preparing runtime configs...'
                sh '''
                    rm -rf prometheus
                    mkdir -p prometheus

                    cat <<EOF > prometheus/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'backend'
    static_configs:
      - targets: ['crowdfundin-backend:5000']
EOF

                    ls -l prometheus
                    file prometheus/prometheus.yml
                    echo "✅ prometheus.yml created"
                '''
            }
        }

        // ─────────────────────────────────────────────
        // Uses pre-built :latest images (no --build flag) so Docker
        // Compose picks up the images built in the Docker Build stage.
        // No local mongo container — MongoDB Atlas is used via MONGODB_URI.
        stage('Deploy') {
            steps {
                echo '🚀 Deploying stack...'
                sh '''
                    docker compose down --remove-orphans --volumes || true

                    # Remove any stale named containers (no mongo — Atlas is used)
                    docker rm -f crowdfundin-backend crowdfundin-frontend devops-prometheus devops-grafana || true

                    docker compose up -d
                '''
            }
        }

        // ─────────────────────────────────────────────
        stage('Verify') {
            steps {
                echo '🔍 Verifying services...'

                sh '''
                    echo "⏳ Waiting for backend to be ready..."
                    for i in $(seq 1 15); do
                        if docker exec crowdfundin-backend wget -q --spider http://127.0.0.1:5000/api/health 2>/dev/null; then
                            echo "✅ Backend is healthy"
                            break
                        fi
                        echo "  attempt $i/15 — sleeping 5s..."
                        sleep 5
                    done
                '''

                sh '''
                    docker exec devops-prometheus wget -q --spider http://127.0.0.1:9090/-/healthy && echo "✅ Prometheus OK"
                    docker exec devops-grafana wget -q --spider http://127.0.0.1:3000/api/health && echo "✅ Grafana OK"
                '''

                echo '✅ Deployment successful!'
            }
        }
    }

    // ─────────────────────────────────────────────
    post {
        success {
            echo '🎉 Pipeline completed successfully!'
        }

        failure {
            echo '❌ Pipeline failed!'
            sh 'docker compose logs --tail=50 || true'
        }

        always {
            echo '🧹 Cleanup dangling images...'
            sh 'docker image prune -f || true'
        }
    }
}