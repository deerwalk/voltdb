/* This file is part of VoltDB.
 * Copyright (C) 2008-2016 VoltDB Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR
 * OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE,
 * ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

 /**
 * Created by anrai on 2/12/15.
 */

package vmcTest.tests

import org.junit.Test
import vmcTest.pages.*
import geb.Page.*

/**
 * This class contains tests of the 'Admin' tab of the VoltDB Management
 * Center (VMC) page, which is the VoltDB (new) web UI.
 */

class AdminSnmpTest extends TestBase {
    def setup() { // called before each test
        int count = 0

        while(count<numberOfTrials) {
            count ++
            try {
                setup: 'Open VMC page'
                to VoltDBManagementCenterPage
                page.loginIfNeeded()
                expect: 'to be on VMC page'
                at VoltDBManagementCenterPage

                when: 'click the Admin link (if needed)'
                page.openAdminPage()
                then: 'should be on Admin page'
                at AdminPage

                break
            } catch (org.openqa.selenium.ElementNotVisibleException e) {
                println("ElementNotVisibleException: Unable to Start the test")
                println("Retrying")
            }
        }
    }

    def checkSnmpTitles() {
        int count = 0
        testStatus = false

        expect: 'at Admin Page'

        while(count<numberOfTrials) {
            count ++
            try {
                when:
                waitFor(waitTime) {
                    page.snmpTitle.isDisplayed()
                    page.snmpTitle.text().toLowerCase().equals("SNMP".toLowerCase())
                }
                then:
                testStatus = true
                break
            } catch(geb.waiting.WaitTimeoutException e) {
                println("RETRYING: WaitTimeoutException occured")
            } catch(org.openqa.selenium.StaleElementReferenceException e) {
                println("RETRYING: StaleElementReferenceException occured")
            }
        }
        if(testStatus == true) {
            println("PASS")
        }
        else {
            println("FAIL: Test didn't pass in " + numberOfTrials + " trials")
            assert false
        }

        when:'click title'
            page.snmpTitle.click()
        then:
            page.snmpTarget.isDisplayed()
            page.snmpTarget.text().toLowerCase().equals("Target".toLowerCase())
            page.snmpCommunity.isDisplayed()
            page.snmpCommunity.text().toLowerCase().equals("Community".toLowerCase())
            page.snmpUsername.isDisplayed()
            page.snmpUsername.text().toLowerCase().equals("username".toLowerCase())
            page.snmpAuthenticationProtocol.isDisplayed()
            page.snmpAuthenticationProtocol.text().toLowerCase().equals("Authentication Protocol".toLowerCase())
            page.snmpAuthenticationKey.isDisplayed()
            page.snmpAuthenticationKey.text().toLowerCase().equals("Authentication Key".toLowerCase())
            page.snmpPrivacyProtocol.isDisplayed()
            page.snmpPrivacyProtocol.text().toLowerCase().equals("Privacy Protocol".toLowerCase())
            page.snmpPrivacyKey.isDisplayed()
            page.snmpPrivacyKey.text().toLowerCase().equals("Privacy Key".toLowerCase())
    }

    def checkSnmpButtons() {
        expect: 'at Admin Page'

        when: 'check snmp edit button'
        waitFor(10){page.snmpEditButton.isDisplayed()}
        then: 'click snmp button'
        page.snmpEditButton.click()
    }

    def targetValueNotEmpty() {
        int count = 0
        testStatus = false
        boolean isPro = false
        boolean snmpEnabled = false

        expect: 'at Admin Page'

        when: "check Pro version"
        if (waitFor(10){page.snmpTitle.isDisplayed()}) {
            isPro = true
        }
        else{
            assert false
        }
        then: "check SNMP enabled"
        if (isPro == true) {
            if (page.snmpEnabled.text().toLowerCase().equals("On")) {
                snmpEnabled = true
            }
        }
        when: "check edit snmp button displayed"
        if (page.editSnmpButton.isDisplayed()) {
            page.editSnmpButton.click()
        }
        if (waitFor(10) { page.editSnmpOkButton.isDisplayed() }) {
            page.editSnmpOkButton.click()
        }

        then: "check target validation"
        if (snmpEnabled == true) {
            if (page.errorTarget.isDisplayed()) {
                println("PASS")
            } else {
                println("FAIL: Test didn't pass")
                assert false
            }

        }

    }

    def checkCommunityDefaultValue(){
        expect: 'at Admin Page'

        when: "click edit button"
            if (page.editSnmpButton.isDisplayed()) {
                page.editSnmpButton.click()
            }
        then:
            if(page.txtCommunity.value().equals("public")){
                assert true
            }
            else{
                println("default value for community is not set")
                assert false
            }
    }

    def checkAuthKeyDefaultValue(){
        expect: 'at Admin Page'

        when: "click edit button"
        if (page.editSnmpButton.isDisplayed()) {
            page.editSnmpButton.click()
        }
        then:
        if(page.txtAuthkey.value().equals("voltdbauthkey")){
            assert true
        }
        else{
            println("default value for authkey is not set")
            assert false
        }
    }

    def checkPrivKeyDefaultValue(){

        expect: 'at Admin Page'

        when: "click edit button"
        if (page.editSnmpButton.isDisplayed()) {
            page.editSnmpButton.click()
        }
        then:
        if(page.txtPrivkey.value().equals("voltdbprivacykey")){
            assert true
        }
        else{
            println("default value for privkey is not set")
            assert false
        }

    }
}
