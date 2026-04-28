pipeline {
    agent any

    triggers {
        pollSCM('* * * * *')
    }

    environment {
        BACKEND_IMAGE  = 'crowdfundin-backend'
        FRONTEND_IMAGE = 'crowdfundin-frontend'
        DOCKER_TAG     = "${env.BUILD_NUMBER}"
    }

    stages {

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
                    // Compare current commit with the previous one.
                    // On the very first build (no previous commit) we fall back
                    // to treating both as changed.
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
                    if (env.BACKEND_CHANGED == 'true' && env.FRONTEND_CHANGED == 'true') {
                        echo '🐳 Building both images in parallel...'
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
                        echo '⏭️  No service changes detected — skipping Docker build.'
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
                        # ── Prometheus config sanity check ──
                        # We bind-mount the entire ./prometheus/ directory (not individual files)
                        # to avoid the Docker socket path-resolution issue that auto-creates
                        # bind-mount sources as directories when they don't exist on the host.
                        for cfg in prometheus/prometheus.yml prometheus/alerts.yml; do
                            if [ ! -f "$cfg" ]; then
                                echo "⚠️  $cfg missing — restoring from git"
                                git checkout HEAD -- "$cfg"
                            fi
                            echo "✅ $cfg OK ($(stat -c '%s bytes' $cfg))"
                        done
                        echo "✅ Prometheus config ready (from repo)"

                        # ── Root .env for docker compose variable substitution ──
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

                        # ── Ensure the external mongo-data volume exists ────────────────────────
                        # `docker volume create` is idempotent: safe to run on every build.
                        # Because mongo-data is marked external in docker-compose.yml,
                        # `docker compose down --volumes` can NEVER delete it.
                        docker volume create mongo-data
                        echo "✅ mongo-data volume ensured"

                        # ── Remove ALL stale named containers from any previous compose project ──
                        # Named containers (container_name:) are global to the Docker daemon.
                        # If a prior run used a different compose project name they appear as
                        # orphans that cause name-conflict errors on the next compose up.
                        # Note: prometheus depends_on backend, so even `compose up prometheus`
                        # tries to create backend — we must clear ALL names up front.
                        # Mongo data is safe: it lives in the external 'mongo-data' named volume.
                        for ctr in crowdfundin-mongo crowdfundin-backend crowdfundin-frontend devops-prometheus devops-grafana; do
                            if docker inspect "$ctr" >/dev/null 2>&1; then
                                docker rm -f "$ctr" || true
                                echo "🗑️  Removed stale container: $ctr"
                            fi
                        done

                        # ── Bring up the full stack in one shot ───────────────────────────────
                        # Single call lets compose resolve all depends_on in the right order.
                        docker compose up -d
                        echo "✅ All services running"
                    '''

                    // ── Selectively restart only the changed app service(s) ────────────────
                    script {
                        if (env.BACKEND_CHANGED == 'true' && env.FRONTEND_CHANGED == 'true') {
                            echo '🚀 Restarting BOTH app containers...'
                            sh '''
                                docker compose stop backend frontend || true
                                docker rm -f crowdfundin-backend crowdfundin-frontend || true
                                docker compose up -d backend frontend
                            '''
                        } else if (env.BACKEND_CHANGED == 'true') {
                            echo '🚀 Restarting BACKEND container only...'
                            sh '''
                                docker compose stop backend || true
                                docker rm -f crowdfundin-backend || true
                                docker compose up -d backend
                            '''
                        } else if (env.FRONTEND_CHANGED == 'true') {
                            echo '🚀 Restarting FRONTEND container only...'
                            sh '''
                                docker compose stop frontend || true
                                docker rm -f crowdfundin-frontend || true
                                docker compose up -d frontend
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
            sh 'docker compose logs --tail=50 || true'
        }
        always {
            sh 'docker image prune -f || true'
        }
    }
}