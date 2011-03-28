<?php
/*
 * Plugin Name: OAC: National Statistics Tool
 * Version: 1.0
 * Plugin URI: http://open.agroclimate.org/downloads/
 * Description: National Statistics Tool - Description TODO
 * Author: The Open AgroClimate Project
 * Author URI: http://open.agroclimate.org/
 * License: BSD Modified
 */

class OACNationalStatsAdmin {
	public function oac_nationalstats_admin_init() {
		$plugin_dir = basename( dirname( __FILE__ ) );
		load_plugin_textdomain( 'oac_nationalstats', null, $plugin_dir . '/languages' );
		if( !current_user_can( 'manage_options' ) ) {
			wp_die( __( 'You do not have sufficient permission to access this page.' ) );
		}
		// Anything else needed to be run (like POST or GET redirection)
		// wp_scoper_admin_action_handler();
	}

	public function oac_nationalstats_admin_menu() {
		add_submenu_page( 'oac_menu', __( 'National Statistics Tool', 'oac_nationalstats' ), __( 'National Statistics Tool', 'oac_nationalstats' ), 'manage_options', 'oac_nationalstats_handle', array( 'OACNationalStatsAdmin', 'oac_nationalstats_admin_page' ) );
	}

	public function oac_nationalstats_admin_page() {
	?>
		<div class="wrap">
		<?php screen_icon( 'tools' ); ?>
		<h2><?php _e( 'Configure National Statistics Tool', 'oac_nationalstats' ); ?></h2>
		<p>Information</p>
		<p>More information here</p>
		</div>
	<?php
	}


	public function oac_nationalstats_install_harness() {
		OACBase::init();
		wp_scoper_admin_setup_scopes( 'location', __FILE__ );
	}

	public function oac_nationalstats_uninstall_harness() {
		OACBase::init();
		wp_scoper_admin_cleanup_scopes( __FILE__ );
	}
} // class OACClimateRiskAdmin

class OACNationalStats {
	private static $location_scope = null;
	private static $plugin_url = '';

	public static function initialize() {
		OACBase::init();
		$filter = null;
		$filters = get_option( 'oac_scope_filters', null );
		if( $filters !== null ) $filter = array_key_exists( 'location_national_stats', $filters ) ? $filters['location_national_stats'] : null;
		self::$location_scope = new WPScoper( 'location', $filter );
	}


	public static function ui_panel()  {
		$output =  '<div id="nationalstats-ui-container" class="oac-ui-container">';
		$output .= '<div id="oac-user-input-panel" class="oac-user-input">';
		$output .= self::$location_scope->generateNestedDDL( '', true );
		$output .= '<div id="type-container"><label for="type">'.__( 'Product Type', 'oac_nationalstats' ).'</label>';
		$output .= '<select id="type" name="type" class="oac-input oac-select">';
		$output .= '<option value="row_crop">'.__( 'Row Crops', 'oac_nationalstats' ).'</option>';
		$output .= '<option value="fruits">'.__('Fruits', 'oac_nationalstats' ).'</option>';
		$output .= '<option value="livestock">'.__( 'Livestock', 'oac_nationalstats' ).'</option>';
		$output .= '</select></div>';
		$output .= '<div id="commodity-container"></div>';
		$output .= '</div>';
		$output .= '<div id="oac-output-panel" class="oac-output">';
		$output .= '<div id="commodity-graph" class="oac-chart"></div>';
		$output .= '</div></div>';
		return $output;
	}
	
	public static function generate_commodity( $location, $type ) {
	}
	
	public static function tabs() {
		$output = <<<ENDTABS
		<div>
			<ul id="tabs">
				<li class="selected">Average &amp; Deviation</li>
				<li>Probability Distribution</li>
				<li>Probability of Exceedance</li>
				<li>Last 5 Years</li>
			</ul>
			<div class="tabcontent selected" id="tabs-1" style="font-size: .6em;">
				<table id="avg-deviation-table" class="oac-table">
ENDTABS;
		$output .= self::month_table_header( true );
		$output .= '<tbody></tbody>';
		$output .= <<<ENDTABS
				</table>
				<div id="avg-deviation-chart" class="oac-chart" style="height: 300px; width: 600px;"></div>
			</div>
			<div class="tabcontent" id="tabs-2" style="font-size: .6em;">
				<table id="prob-dist-table" class="oac-table">
ENDTABS;
		$output .= self::month_table_header();
		$output .= '<tbody></tbody>';
		$output .= <<<ENDTABS
				</table>
				<div id="prob-dist-chart" class="oac-chart"></div>
			</div>
			<div class="tabcontent" id="tabs-3" style="font-size: .6em;">
				<table id="prob-exceed-table" class="oac-table">
ENDTABS;
		$output .= self::month_table_header();
		$output .= '<tbody></tbody>';
		$output .= <<<ENDTABS
				</table>
				<div id="prob-exceed-chart" class="oac-chart"></div>
			</div>
			<div class="tabcontent" id="tabs-4" style="font-size: .6em;">
				<table id="five-year-table" class="oac-table">
ENDTABS;
		$output .= self::month_table_header( true );
		$output .= '<tbody></tbody>';
		$output .= <<<ENDTABS
				</table>
				<div id="five-year-chart" class="oac-chart"></div>
			</div>
		</div>
ENDTABS;
		return $output;
	}

	public static function output() {
		$output = self::ui_panel();
		return $output;
	}

	public static function hijack_header() {
		global $post;
		global $is_IE;
		$regex = get_shortcode_regex();
		preg_match('/'.$regex.'/s', $post->post_content, $matches);
		if ((isset( $matches[2])) && ($matches[2] == 'oac_nationalstats')) {
			wp_enqueue_style( 'oacnationalstats', plugins_url( 'css/oac-nationalstats.css', __FILE__ ), array( 'oacbase' ) );
			wp_register_script( 'oac_nationalstats', plugins_url( 'js/oac-nationalstats.js', __FILE__ ),
				array( 'oac-base', 'mootools-array-math', 'oac-linechart' )
			);
			wp_enqueue_script( 'oac_nationalstats' );
			add_action( 'wp_head', array( 'OACBase', 'ie_conditionals' ), 3 );
		}
	}
}

// WordPress Hooks and Actions
register_activation_hook( __FILE__, array( 'OACNationalStatsAdmin', 'oac_nationalstats_install_harness' ) );
register_deactivation_hook( __FILE__, array( 'OACNationalStatsAdmin', 'oac_nationalstats_uninstall_harness' ) );
if( is_admin() ) {
	add_action( 'admin_menu', array( 'OACNationalStatsAdmin', 'oac_nationalstats_admin_menu' ) );
	add_action( 'admin_init', array( 'OACNationalStatsAdmin', 'oac_nationalstats_admin_init' ) );
} else {
	// Add front-end specific actions/hooks here
	add_action( 'init', array( 'OACNationalStats', 'initialize' ) );
	add_action( 'template_redirect', array( 'OACNationalStats', 'hijack_header' ) );
	add_shortcode('oac_nationalstats', array( 'OACNationalStats', 'output' ) );
}
// Add all non-specific actions/hooks here
//
//
?>
