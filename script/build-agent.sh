#!/bin/bash
#
# Persistent Build Agent
# Runs builds continuously until success, with detailed error logging
# Supports pulling GitHub PRs and working on them
#

set -e

# Configuration
MAX_ATTEMPTS=${MAX_ATTEMPTS:-50}
BUILD_CMD=${BUILD_CMD:-"npm run build"}
LINT_CMD=${LINT_CMD:-"npm run lint"}
LOG_DIR="${LOG_DIR:-./build-logs}"
WORKSPACE_ROOT="${WORKSPACE_ROOT:-$(pwd)}"
PR_NUMBER=""
PR_URL=""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Initialize
mkdir -p "$LOG_DIR"
ATTEMPT=0
BUILD_SUCCESS=false
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

log() {
    echo -e "${BLUE}[BUILD-AGENT]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_pr() {
    echo -e "${CYAN}[PR]${NC} $1"
}

# Pull a PR by number or URL
pull_pr() {
    local pr_ref="$1"
    
    log_pr "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_pr "Pulling PR: $pr_ref"
    log_pr "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    cd "$WORKSPACE_ROOT"
    
    # Check if gh is available
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed"
        return 1
    fi
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated. Run 'gh auth login' first."
        return 1
    fi
    
    # Extract PR number if URL was provided
    if [[ "$pr_ref" =~ ^https://github.com/.*/pull/([0-9]+) ]]; then
        PR_NUMBER="${BASH_REMATCH[1]}"
        log_pr "Extracted PR number: $PR_NUMBER from URL"
    elif [[ "$pr_ref" =~ ^[0-9]+$ ]]; then
        PR_NUMBER="$pr_ref"
    else
        log_error "Invalid PR reference: $pr_ref (use PR number or GitHub URL)"
        return 1
    fi
    
    # Get PR details
    log_pr "Fetching PR #$PR_NUMBER details..."
    PR_INFO=$(gh pr view "$PR_NUMBER" --json number,title,headRefName,state,url 2>&1) || {
        log_error "Failed to fetch PR #$PR_NUMBER"
        log_error "$PR_INFO"
        return 1
    }
    
    PR_TITLE=$(echo "$PR_INFO" | grep -o '"title":"[^"]*"' | cut -d'"' -f4)
    PR_BRANCH=$(echo "$PR_INFO" | grep -o '"headRefName":"[^"]*"' | cut -d'"' -f4)
    PR_STATE=$(echo "$PR_INFO" | grep -o '"state":"[^"]*"' | cut -d'"' -f4)
    PR_URL=$(echo "$PR_INFO" | grep -o '"url":"[^"]*"' | cut -d'"' -f4)
    
    log_pr "PR #$PR_NUMBER: $PR_TITLE"
    log_pr "Branch: $PR_BRANCH"
    log_pr "State: $PR_STATE"
    log_pr "URL: $PR_URL"
    echo ""
    
    # Checkout the PR
    log_pr "Checking out PR #$PR_NUMBER..."
    if gh pr checkout "$PR_NUMBER" 2>&1 | tee "$LOG_DIR/pr_checkout_$TIMESTAMP.log"; then
        log_success "Successfully checked out PR #$PR_NUMBER"
    else
        log_error "Failed to checkout PR #$PR_NUMBER"
        return 1
    fi
    
    # Update dependencies if package.json changed
    if git diff HEAD~1 --name-only 2>/dev/null | grep -q "package.json"; then
        log_pr "package.json changed, reinstalling dependencies..."
        npm install 2>&1 | tee "$LOG_DIR/npm_install_pr_$TIMESTAMP.log"
    fi
    
    echo ""
    log_success "PR #$PR_NUMBER is ready for building"
    echo ""
    
    return 0
}

# Main build loop
run_build_agent() {
    log "Starting Persistent Build Agent"
    log "Max attempts: $MAX_ATTEMPTS"
    log "Build command: $BUILD_CMD"
    log "Workspace: $WORKSPACE_ROOT"
    log "Log directory: $LOG_DIR"
    if [ -n "$PR_NUMBER" ]; then
        log "PR: #$PR_NUMBER"
    fi
    echo ""
    
    cd "$WORKSPACE_ROOT"
    
    # Pull PR if specified
    if [ -n "$PR_NUMBER" ] || [ -n "$PR_URL" ]; then
        local pr_ref="${PR_URL:-$PR_NUMBER}"
        if ! pull_pr "$pr_ref"; then
            log_error "Failed to pull PR, aborting"
            return 1
        fi
    fi
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        log "Installing dependencies..."
        npm install 2>&1 | tee "$LOG_DIR/npm_install_$TIMESTAMP.log"
    fi
    
    while [ $ATTEMPT -lt $MAX_ATTEMPTS ] && [ "$BUILD_SUCCESS" = false ]; do
        ATTEMPT=$((ATTEMPT + 1))
        BUILD_LOG="$LOG_DIR/build_attempt_${ATTEMPT}_$TIMESTAMP.log"
        
        log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log "Attempt $ATTEMPT of $MAX_ATTEMPTS"
        log "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        
        # Run the build
        if $BUILD_CMD 2>&1 | tee "$BUILD_LOG"; then
            BUILD_SUCCESS=true
            log_success "BUILD SUCCEEDED on attempt $ATTEMPT!"
            
            # Run lint check
            log "Running lint check..."
            LINT_LOG="$LOG_DIR/lint_$TIMESTAMP.log"
            if $LINT_CMD 2>&1 | tee "$LINT_LOG"; then
                log_success "Lint check passed!"
            else
                log_warning "Lint check has warnings/errors (see $LINT_LOG)"
            fi
            
            # Final summary
            echo ""
            log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            log_success "BUILD COMPLETED SUCCESSFULLY"
            log_success "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            log_success "Total attempts: $ATTEMPT"
            log_success "Build log: $BUILD_LOG"
            log_success "Timestamp: $(date)"
            echo ""
            
            # Create success marker
            echo "{
  \"status\": \"success\",
  \"attempts\": $ATTEMPT,
  \"timestamp\": \"$(date -Iseconds)\",
  \"build_log\": \"$BUILD_LOG\"
}" > "$LOG_DIR/build_status.json"
            
            return 0
        else
            log_error "Build failed on attempt $ATTEMPT"
            log "Error log saved to: $BUILD_LOG"
            
            # Extract and display key errors
            log "Key errors detected:"
            grep -E "(error TS|Error:|failed|Module not found)" "$BUILD_LOG" | head -20 || true
            
            echo ""
            log_warning "Waiting 2 seconds before retry..."
            sleep 2
        fi
    done
    
    if [ "$BUILD_SUCCESS" = false ]; then
        log_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_error "BUILD FAILED after $MAX_ATTEMPTS attempts"
        log_error "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_error "Review logs in: $LOG_DIR"
        
        # Create failure marker
        echo "{
  \"status\": \"failed\",
  \"attempts\": $ATTEMPT,
  \"timestamp\": \"$(date -Iseconds)\",
  \"build_log\": \"$BUILD_LOG\"
}" > "$LOG_DIR/build_status.json"
        
        return 1
    fi
}

# Show help
show_help() {
    echo "Persistent Build Agent"
    echo ""
    echo "Usage: $0 [options] [PR_NUMBER_OR_URL]"
    echo ""
    echo "Options:"
    echo "  -h, --help       Show this help message"
    echo "  -m, --max N      Set maximum attempts (default: 50)"
    echo "  -c, --cmd CMD    Set build command (default: 'npm run build')"
    echo "  -p, --pr PR      Pull request number or GitHub URL"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Build current branch"
    echo "  $0 --pr 123                           # Pull PR #123 and build"
    echo "  $0 --pr https://github.com/org/repo/pull/123"
    echo "  $0 123                                # Shorthand for --pr 123"
    echo ""
    echo "Environment variables:"
    echo "  MAX_ATTEMPTS   Maximum build attempts"
    echo "  BUILD_CMD      Build command to run"
    echo "  LINT_CMD       Lint command to run"
    echo "  LOG_DIR        Directory for build logs"
    echo "  WORKSPACE_ROOT Workspace root directory"
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -m|--max)
            MAX_ATTEMPTS="$2"
            shift 2
            ;;
        -c|--cmd)
            BUILD_CMD="$2"
            shift 2
            ;;
        -p|--pr)
            PR_URL="$2"
            shift 2
            ;;
        [0-9]*)
            # Positional argument that looks like a PR number
            PR_NUMBER="$1"
            shift
            ;;
        https://github.com/*)
            # GitHub URL
            PR_URL="$1"
            shift
            ;;
        *)
            log_error "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run the agent
run_build_agent
