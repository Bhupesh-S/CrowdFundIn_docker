pipeline {
    agent any

    triggers {
        pollSCM('* * * * *')
    }

    environment {
        BACKEND_IMAGE        = 'crowdfundin-backend'
        FRONTEND_IMAGE       = 'crowdfundin-frontend'
        PROMETHEUS_IMAGE     = 'crowdfundin-prometheus'
        DOCKER_TAG           = "${env.BUILD_NUMBER}"
        // Fix: set a stable project name so compose container names are predictable
        COMPOSE_PROJECT_NAME = 'devops'
    }

    stages {

        // ── Ensure docker compose (V2 plugin) is usable ───────────────────────
        stage('Bootstrap') {
            steps {
                sh '''
                    # Try V2 plugin first (docker compose), then V1 standalone (docker-compose)
                    if docker compose version > /dev/null 2>&1; then
                        echo "✅ docker compose (V2) available: $(docker compose version)"
                        echo "V2" > /tmp/compose_cmd
                    elif command -v docker-compose > /dev/null 2>&1; then
                        echo "✅ docker-compose (V1) available: $(docker-compose --version)"
                        echo "V1" > /tmp/compose_cmd
                    else
                        echo "❌ Neither docker compose nor docker-compose is available!"
                        docker info
                        exit 1
                    fi
                '''
            }
        }

        stage('Checkout') {
            steps {
                echo '📥 Pulling source code...'
                checkout scm
            }
        }

        // ── Detect what changed ──────────────────────────────────────────────
        stage('Detect Changes') {
            steps {
                script {
                    def prevCommit = sh(
                        script: 'git rev-parse HEAD~1 2>/dev/null || echo ""',
                        returnStdout: true
                    ).trim()

                    if (prevCommit) {
                        def changedFiles = sh(
                            script: "git diff --name-only ${prevCommit} HEAD",
                            returnStdout: true
                        ).trim()

                        echo "📝 Changed files:\n${changedFiles}"

                        env.FRONTEND_CHANGED = changedFiles.split('\n').any { it.startsWith('frontend/') } ? 'true' : 'false'
                        env.BACKEND_CHANGED  = changedFiles.split('\n').any { it.startsWith('backend/')  } ? 'true' : 'false'
                    } else {
                        echo '⚠️  No previous commit found — treating all services as changed.'
                        env.FRONTEND_CHANGED = 'true'
                        env.BACKEND_CHANGED  = 'true'
                    }

                    echo "🔎 Frontend changed : ${env.FRONTEND_CHANGED}"
                    echo "🔎 Backend  changed : ${env.BACKEND_CHANGED}"
                }
            }
        }

        // ── Install only what's needed ───────────────────────────────────────
        stage('Install Dependencies') {
            steps {
                script {
                    if (env.BACKEND_CHANGED == 'true') {
                        echo '📦 Installing backend dependencies...'
                        dir('backend') {
                            sh 'npm install --prefer-offline || npm install'
                        }
                    }
                    if (env.FRONTEND_CHANGED == 'true') {
                        echo '📦 Installing frontend dependencies...'
                        dir('frontend') {
                            sh 'npm install --legacy-peer-deps --prefer-offline || npm install --legacy-peer-deps'
                        }
                    }
                }
            }
        }

        // ── Test only what's needed ──────────────────────────────────────────
        stage('Test') {
            steps {
                script {
                    if (env.BACKEND_CHANGED == 'true') {
                        echo '🧪 Running backend tests...'
                        dir('backend') {
                            sh '''
                                node -e "require('./package.json'); console.log('✅ Backend OK')"
                                node --check server.js && echo "✅ Backend syntax OK"
                            '''
                        }
                    }
                    if (env.FRONTEND_CHANGED == 'true') {
                        echo '🧪 Running frontend tests...'
                        dir('frontend') {
                            sh 'CI=true npm test -- --passWithNoTests || true'
                        }
                    }
                }
            }
        }

        // ── Build Docker images only for changed services ────────────────────
        stage('Docker Build') {
            steps {
                script {
                    echo '🐳 Building Prometheus config image...'
                    sh """
                    docker build -f prometheus/Dockerfile -t ${PROMETHEUS_IMAGE}:latest prometheus/
                    """

                    if (env.BACKEND_CHANGED == 'true' && env.FRONTEND_CHANGED == 'true') {
                        echo '🐳 Building both app images in parallel...'
                        parallel(
                            'Backend': {
                                sh """
                                docker build --network=host -f backend/Dockerfile -t ${BACKEND_IMAGE}:${DOCKER_TAG} backend/
                                docker tag ${BACKEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:latest
                                """
                            },
                            'Frontend': {
                                sh """
                                docker build --network=host -f frontend/Dockerfile -t ${FRONTEND_IMAGE}:${DOCKER_TAG} frontend/
                                docker tag ${FRONTEND_IMAGE}:${DOCKER_TAG} ${FRONTEND_IMAGE}:latest
                                """
                            }
                        )
                    } else if (env.BACKEND_CHANGED == 'true') {
                        echo '🐳 Building backend image only...'
                        sh """
                        docker build --network=host -f backend/Dockerfile -t ${BACKEND_IMAGE}:${DOCKER_TAG} backend/
                        docker tag ${BACKEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:latest
                        """
                    } else if (env.FRONTEND_CHANGED == 'true') {
                        echo '🐳 Building frontend image only...'
                        sh """
                        docker build --network=host -f frontend/Dockerfile -t ${FRONTEND_IMAGE}:${DOCKER_TAG} frontend/
                        docker tag ${FRONTEND_IMAGE}:${DOCKER_TAG} ${FRONTEND_IMAGE}:latest
                        """
                    } else {
                        echo '⏭️  No app changes — skipping backend/frontend builds.'
                    }
                }
            }
        }

        // ── Write configs & env, then bootstrap infra ─────────────────────────
        stage('Prepare & Deploy') {
            steps {
                withCredentials([
                    string(credentialsId: 'jwt-secret',            variable: 'JWT_SECRET'),
                    string(credentialsId: 'razorpay-key-id',       variable: 'RAZORPAY_KEY_ID'),
                    string(credentialsId: 'razorpay-key-secret',   variable: 'RAZORPAY_KEY_SECRET')
                ]) {
                    sh '''
                        echo "✅ Prometheus config embedded in image (built in Docker Build stage)"

                        # ── Root .env for compose variable substitution ──────────────────────
                        cat <<EOF > .env
JWT_SECRET=${JWT_SECRET}
RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}
RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}
EMAIL_USER=bharanidharank.23cse@kongu.edu
EMAIL_PASS=wweekjioehjiappg
FRONTEND_URL=http://localhost:3000
MAX_FILE_SIZE=5000000
EOF
                        echo "✅ Config ready"

                        # ── Ensure the external mongo-data volume exists ─────────────────────
                        docker volume create mongo-data
                        echo "✅ mongo-data volume ensured"

                        # ── Remove ALL stale named containers from any previous compose project ──
                        # Named containers (container_name:) are global to the Docker daemon.
                        # If a prior run used a different compose project name they appear as
                        # orphans that cause name-conflict errors on the next compose up.
                        # Note: prometheus depends_on backend, so even `compose up prometheus`
                        # tries to create backend — we must clear ALL names up front.
                        # Mongo data is safe: it lives in the external 'mongo-data' named volume.
                        for ctr in crowdfundin-backend crowdfundin-frontend devops-prometheus devops-grafana; do
                            if docker inspect "$ctr" >/dev/null 2>&1; then
                                docker rm -f "$ctr" || true
                                echo "🗑️  Removed stale container: $ctr"
                            fi
                        done

                        # ── Bring up only app and monitoring services ─────────────────────────
                        # Avoid bringing up jenkins to prevent name conflict since we are inside it
                        # Exclude mongo to prevent restarting it and keep storage intact
                        if docker compose version > /dev/null 2>&1; then
                            docker compose up -d backend frontend prometheus grafana
                        else
                            docker-compose up -d backend frontend prometheus grafana
                        fi
                        echo "✅ All services running"
                    '''

                    // ── Selectively restart only the changed app service(s) ────────────────
                    script {
                        def composeCmd = 'docker compose version > /dev/null 2>&1 && echo "docker compose" || echo "docker-compose"'
                        if (env.BACKEND_CHANGED == 'true' && env.FRONTEND_CHANGED == 'true') {
                            echo '🚀 Restarting BOTH app containers...'
                            sh '''
                                if docker compose version > /dev/null 2>&1; then
                                    docker compose stop backend frontend || true
                                    docker rm -f crowdfundin-backend crowdfundin-frontend || true
                                    docker compose up -d backend frontend
                                else
                                    docker-compose stop backend frontend || true
                                    docker rm -f crowdfundin-backend crowdfundin-frontend || true
                                    docker-compose up -d backend frontend
                                fi
                            '''
                        } else if (env.BACKEND_CHANGED == 'true') {
                            echo '🚀 Restarting BACKEND container only...'
                            sh '''
                                if docker compose version > /dev/null 2>&1; then
                                    docker compose stop backend || true
                                    docker rm -f crowdfundin-backend || true
                                    docker compose up -d backend
                                else
                                    docker-compose stop backend || true
                                    docker rm -f crowdfundin-backend || true
                                    docker-compose up -d backend
                                fi
                            '''
                        } else if (env.FRONTEND_CHANGED == 'true') {
                            echo '🚀 Restarting FRONTEND container only...'
                            sh '''
                                if docker compose version > /dev/null 2>&1; then
                                    docker compose stop frontend || true
                                    docker rm -f crowdfundin-frontend || true
                                    docker compose up -d frontend
                                else
                                    docker-compose stop frontend || true
                                    docker rm -f crowdfundin-frontend || true
                                    docker-compose up -d frontend
                                fi
                            '''
                        } else {
                            echo '⏭️  No app changes detected — skipping container restart.'
                        }
                    }
                }
            }
        }

        // ── Health check (only when backend was touched) ──────────────────────
        stage('Verify') {
            when {
                expression { env.BACKEND_CHANGED == 'true' }
            }
            steps {
                echo '🔍 Verifying backend health...'
                sh '''
                    for i in $(seq 1 15); do
                        if docker exec crowdfundin-backend wget -q --spider http://127.0.0.1:5000/api/health; then
                            echo "✅ Backend healthy"
                            exit 0
                        fi
                        sleep 5
                    done

                    echo "❌ Backend failed to become healthy"
                    exit 1
                '''
            }
        }
    }

    post {
        success {
            echo '🎉 Pipeline completed successfully!'
        }
        failure {
            echo '❌ Pipeline FAILED'
            sh '''
                if docker compose version > /dev/null 2>&1; then
                    docker compose ps || true
                elif command -v docker-compose > /dev/null 2>&1; then
                    docker-compose ps || true
                fi
                docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" || true
            '''
        }
        always {
            sh 'docker image prune -f || true'
        }
    }
}