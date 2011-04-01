<?php
// Load WP necessities
$wp_root = explode('wp-content', __FILE__);
$wp_root = $wp_root[0];


if( file_exists( $wp_root.'wp-load.php' ) ) {
	require_once( $wp_root.'wp-load.php' );
}

// Are you a proper ajax call?
if( ! isset( $_SERVER['HTTP_X_REQUESTED_WITH']) ) { die( "<img src=\"./kp.jpg\"><p>Prepare the kat-a-pult!</p>" ); }
if( $_SERVER['HTTP_X_REQUESTED_WITH'] == "XMLHttpRequest" ) {
	if( isset( $_REQUEST['route'] ) ) {
		switch( $_REQUEST['route'] ) {
			case 'getCommodities':
			  $html = OACNationalStatsAjax::generateCommodityList( $_REQUEST['type'], $_REQUEST['location'] );
			  echo $html;
			  break;
		  case 'getData':
			  $json = OACNationalStatsAjax::getData( $_REQUEST['type'], $_REQUEST['location'], $_REQUEST['crop'], $_REQUEST['practice'] );
			  echo json_encode( $json );
			  break;
		}
  }
} else {
	die( "<img src=\"./kp.jpg\"><p>Prepare the kat-a-pult!</p>" );
}

class OACNationalStatsAjax {
  public static function generateCommodityList( $type, $location, $threshold=7 ) {
    global $wpdb;    
    $args = array( $type, $location, $threshold );
    // EX: SELECT  `commodity_id`, `commodity` FROM `commodity_data`,`location_py` WHERE (`location_py`.`location_id` = `commodity_data`.`location_id`) AND (`commodity_data`.`type` = 'fruits') AND (`location_py`.`oac_scope_location_id` = '0') AND (`commodity_data`.`v_value` IS NOT NULL) GROUP BY `commodity_data`.`commodity` HAVING( COUNT(`commodity_data`.`v_value`) > 3) ORDER BY `commodity` ASC 
    $query = "SELECT  `commodity_id`, `commodity` FROM `commodity_data`,`location_py` WHERE (`location_py`.`location_id` = `commodity_data`.`location_id`) AND (`commodity_data`.`type` = %s) AND (`location_py`.`oac_scope_location_id` = %s) AND (`commodity_data`.`v_value` IS NOT NULL) GROUP BY `commodity_data`.`commodity` HAVING( COUNT(`commodity_data`.`v_value`) > %d) ORDER BY `commodity` ASC";
    $results = $wpdb->get_results( $wpdb->prepare( $query, $args ), ARRAY_A );
    if( count( $results ) == 0 ) return __( 'No commodities found. Please choose another product type.', 'oac_nationalstats' );
    $return  = '<label for="commodity">'.__( 'Commodity', 'oac_nationalstats' ).'</label>';  
    $return .= '<select name="commodity" id="commodity" class="oac-input oac-select">';
    foreach( $results as $row ) {
          $return .= '<option value="'.$row['commodity_id'].'">'.$row['commodity'].'</option>';
    }
    $return .= '</select><ul id="practice-select">';
    switch( $type ) {
		case 'row_crop':
			$return .= '<li><input type="radio" name="practice" value="yield" '.( $type == 'row_crop' ? 'checked' : '' ).'>'.__( 'Yield', 'oac_nationalstats' ).'</li>';	
		case 'fruits':
			$return .= '<li><input type="radio" name="practice" value="planted" '.( $type == 'fruits' ? 'checked' : '' ).'>'.__( 'Planted Area', 'oac_nationalstats' ).'</li>';
		case 'livestock':
			$return .= '<li><input type="radio" name="practice" value="production" '.( $type == 'livestock' ? 'checked' : '' ).'>'.__( 'Production', 'oac_nationalstats' ).'</li>';
			break;
    }
    $return .= '</ul>';
    return $return;
  }
  
  public static function getData( $type, $location, $crop, $practice ) {
    global $wpdb;
    $args = array( $type, $location, $crop, $practice );
    // EX: SELECT `commodity_data`.`v_value`, `commodity_data`.`yyyy`, `year_classification`.`enso_id` FROM `commodity_data`, `year_classification` WHERE (`commodity_data`.`location_id` = 1) AND (`commodity_data`.`commodity_id` = 1) AND (`commodity_data`.`type` = 'fruits') AND (`commodity_data`.`practice` = 'planted' ) AND (`commodity_data`.`yyyy` = `year_classification`.`yyyy`) ORDER BY `commodity_data`.`yyyy` ASC
    $query = "SELECT `commodity_data`.`v_value`, `commodity_data`.`yyyy`, `year_classification`.`enso_id` FROM `commodity_data`, `year_classification`, `location_py` WHERE (`location_py`.`location_id` = `commodity_data`.`location_id` ) AND ( `commodity_data`.`type` = %s ) AND ( `location_py`.`oac_scope_location_id` = %s ) AND ( `commodity_data`.`commodity_id` = %d ) AND ( `commodity_data`.`practice` = %s ) AND ( `commodity_data`.`yyyy` = `year_classification`.`yyyy` ) ORDER BY `commodity_data`.`yyyy` ASC";
    $prep  = $wpdb->prepare( $query, $args );
    $results = $wpdb->get_results( $prep, ARRAY_A );
    $data = $years = $enso = array();
    if( count( $results ) == 0 ) return array( 'data' => $data, 'years' => $years, 'enso' => $enso );
    foreach( $results as $row ) {
	    $data[]  =  is_null($row['v_value']) ? null :intval( $row['v_value'] );
	    $years[] = $row['yyyy'];
	    $enso[]  = intval( $row['enso_id'] );
    }
    return array( 'data' => $data, 'years' => $years, 'enso' => $enso, 'xlabel' => __( 'Years', 'oac_nationalstats' ) );
  }
}
?>
